const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

if (require('electron-squirrel-startup')) {
  app.quit();
}

let db;

// Helper to get local ISO string (YYYY-MM-DD HH:mm:ss)
const getLocalTimestamp = () => {
  return new Date().toLocaleString('sv-SE', { timeZoneName: undefined });
};

function setupDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'clinic.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.prepare(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      phone TEXT,
      created_at DATETIME
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      diagnosis TEXT,
      date DATETIME,
      FOREIGN KEY(patient_id) REFERENCES patients(id)
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS prescription_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_id INTEGER NOT NULL,
      medicine TEXT NOT NULL,
      dosage TEXT,
      duration TEXT,
      instruction TEXT,
      FOREIGN KEY(prescription_id) REFERENCES prescriptions(id)
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      default_dosage TEXT,
      default_duration TEXT,
      default_instruction TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      diagnosis TEXT,
      start_date TEXT,
      end_date TEXT,
      created_at DATETIME,
      FOREIGN KEY(patient_id) REFERENCES patients(id)
    )
  `).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`).run();
  db.prepare(`CREATE TABLE IF NOT EXISTS templates (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, diagnosis TEXT, medicines TEXT)`).run();

  // 1. Speeds up name search (COLLATE NOCASE makes 'b' find 'Basil')
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name COLLATE NOCASE)`).run();
  
  // 2. Speeds up phone search
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone)`).run();

  // 3. Speeds up the "Last Visit" calculation (Sorts prescriptions/certs instantly)
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_prescriptions_pid_date ON prescriptions(patient_id, date)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_certificates_pid_date ON certificates(patient_id, created_at)`).run();

  console.log('✅ Database connected at:', dbPath);
}

// --- IPC HANDLERS ---

ipcMain.handle('add-patient', async (event, patient) => {
  const created_at = getLocalTimestamp(); // FIXED: Local time
  const stmt = db.prepare('INSERT INTO patients (name, age, gender, phone, created_at) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(patient.name, patient.age, patient.gender, patient.phone, created_at);
  return { success: true, id: info.lastInsertRowid };
});

ipcMain.handle('save-prescription', async (event, data) => {
  const { patientId, diagnosis, medicines } = data;
  const date = getLocalTimestamp(); // FIXED: Local time

  const createTransaction = db.transaction(() => {
    const stmt = db.prepare('INSERT INTO prescriptions (patient_id, diagnosis, date) VALUES (?, ?, ?)');
    const info = stmt.run(patientId, diagnosis, date);
    const prescriptionId = info.lastInsertRowid;

    const insertItem = db.prepare(`INSERT INTO prescription_items (prescription_id, medicine, dosage, duration, instruction) VALUES (?, ?, ?, ?, ?)`);
    const upsertInventory = db.prepare(`
      INSERT INTO inventory (name, default_dosage, default_duration, default_instruction)
      VALUES (?, ?, ?, ?) ON CONFLICT(name) DO UPDATE SET
      default_dosage = excluded.default_dosage, default_duration = excluded.default_duration, default_instruction = excluded.default_instruction
    `);

    for (const med of medicines) {
      insertItem.run(prescriptionId, med.name, med.dosage, med.duration, med.instruction);
      upsertInventory.run(med.name, med.dosage, med.duration, med.instruction);
    }
    return prescriptionId;
  });

  try {
    const id = createTransaction();
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// main.js

ipcMain.handle('get-patients', async (event, searchQuery = '') => {
  try {
    let sql = `
      SELECT p.*,
      MAX(
        COALESCE((SELECT date FROM prescriptions WHERE patient_id = p.id ORDER BY date DESC LIMIT 1), ''),
        COALESCE((SELECT created_at FROM certificates WHERE patient_id = p.id ORDER BY created_at DESC LIMIT 1), '')
      ) as last_visit
      FROM patients p
    `;

    const params = [];
    if (searchQuery.trim() !== '') {
      // ---------------- CHANGE IS HERE ----------------
      sql += ` WHERE p.name LIKE ? OR p.phone LIKE ? `;
      
      // Name: Uses `${searchQuery}%` (Starts with)
      // Phone: Uses `%${searchQuery}%` (Contains - easier for finding partial numbers)
      params.push(`${searchQuery}%`, `%${searchQuery}%`);
      // ------------------------------------------------
    }

    sql += ` GROUP BY p.id ORDER BY MAX(last_visit, p.created_at) DESC`;

    if (searchQuery.trim() === '') {
      sql += ` LIMIT 30`;
    }

    return db.prepare(sql).all(...params);
  } catch (error) { 
    console.error(error);
    return []; 
  }
});

ipcMain.handle('print-prescription', async (event, htmlContent) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('paperSize');
  const paperSize = row ? row.value : 'A4';

  const printWindow = new BrowserWindow({ 
    show: false, // Keep it false, but we'll use a delay
    webPreferences: { nodeIntegration: true, contextIsolation: false } 
  });
  
  printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  
  printWindow.webContents.on('did-finish-load', () => {
    // Give the doctor's laptop 200ms to render the HTML fully
    setTimeout(() => {
      printWindow.webContents.print({ 
        silent: false, // This will force the Windows Print Popup to appear
        printBackground: true, 
        pageSize: paperSize 
      }, (success) => { 
        printWindow.close(); 
      });
    }, 200);
  });
  return { success: true };
});

ipcMain.handle('get-inventory', async () => { return db.prepare('SELECT * FROM inventory ORDER BY name ASC').all(); });

ipcMain.handle('get-patient-history', async (event, patientId) => {
  const sql = `
    SELECT id, diagnosis, date, 'RX' as type, NULL as start_date, NULL as end_date FROM prescriptions WHERE patient_id = ?
    UNION ALL
    SELECT id, diagnosis, created_at as date, 'CERT' as type, start_date, end_date FROM certificates WHERE patient_id = ?
    ORDER BY date DESC
  `;
  return db.prepare(sql).all(patientId, patientId);
});

ipcMain.handle('get-prescription-details', async (event, id) => { return db.prepare('SELECT * FROM prescription_items WHERE prescription_id = ?').all(id); });

ipcMain.handle('save-certificate', async (event, data) => {
  try {
    const { patientId, diagnosis, startDate, endDate } = data;
    const createdAt = getLocalTimestamp(); 
    db.prepare(`INSERT INTO certificates (patient_id, diagnosis, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?)`).run(patientId, diagnosis, startDate, endDate, createdAt);
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('get-settings', async () => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(row => settings[row.key] = row.value);
  return settings;
});

ipcMain.handle('save-settings', async (event, settingsObj) => {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  db.transaction((obj) => { for (const [key, value] of Object.entries(obj)) { stmt.run(key, value); } })(settingsObj);
  return { success: true };
});

ipcMain.handle('delete-medicine', async (event, id) => {
  db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
  return { success: true };
});

ipcMain.handle('update-medicine', async (event, data) => {
  db.prepare(`UPDATE inventory SET name = ?, default_dosage = ?, default_duration = ?, default_instruction = ? WHERE id = ?`).run(data.name, data.dosage, data.duration, data.instruction, data.id);
  return { success: true };
});

ipcMain.handle('add-medicine', async (event, data) => {
  const exists = db.prepare('SELECT id FROM inventory WHERE name = ?').get(data.name);
  if (exists) return { success: false, error: "Medicine already exists." };
  db.prepare(`INSERT INTO inventory (name, default_dosage, default_duration, default_instruction) VALUES (?, ?, ?, ?)`).run(data.name, data.dosage, data.duration, data.instruction);
  return { success: true };
});

// --- UPDATED DASHBOARD STATS HANDLER (LOCAL TIME FIXED) ---
ipcMain.handle('get-dashboard-stats', async () => {
  try {
    // 1. Get current Local Time components
    const now = new Date();
    const todayStr = now.toLocaleString('sv-SE').split(' ')[0]; // "YYYY-MM-DD"
    const currentMonth = todayStr.slice(0, 7); // "YYYY-MM"
    const currentYear = now.getFullYear();

    // 2. Total Patients
    const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;

    // 3. Visits Today
    const todayCount = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT date FROM prescriptions WHERE date LIKE ?
        UNION ALL
        SELECT created_at FROM certificates WHERE created_at LIKE ?
      )
    `).get(`${todayStr}%`, `${todayStr}%`).count;

    // 4. Visits This Month
    const monthCount = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT date FROM prescriptions WHERE date LIKE ?
        UNION ALL
        SELECT created_at FROM certificates WHERE created_at LIKE ?
      )
    `).get(`${currentMonth}%`, `${currentMonth}%`).count;

    // 5. Weekly Stats (Last 7 Days)
    const weeklyStats = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleString('sv-SE').split(' ')[0];
      const label = days[d.getDay()];

      const count = db.prepare(`
        SELECT COUNT(*) as c FROM (
          SELECT date FROM prescriptions WHERE date LIKE ?
          UNION ALL
          SELECT created_at FROM certificates WHERE created_at LIKE ?
        )
      `).get(`${dayStr}%`, `${dayStr}%`).c;
      
      weeklyStats.push({ label, count });
    }

    // 6. Yearly Stats (Current Year)
    const yearlyStats = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < 12; i++) {
      const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      const count = db.prepare(`
        SELECT COUNT(*) as c FROM (
          SELECT date FROM prescriptions WHERE date LIKE ?
          UNION ALL
          SELECT created_at FROM certificates WHERE created_at LIKE ?
        )
      `).get(`${monthStr}%`, `${monthStr}%`).c;
      yearlyStats.push({ label: months[i], count });
    }

    return { totalPatients, todayCount, monthCount, weeklyStats, yearlyStats };
  } catch (error) { return { error: error.message }; }
});

ipcMain.handle('get-templates', () => db.prepare('SELECT * FROM templates ORDER BY name ASC').all());
ipcMain.handle('save-template', (event, data) => {
  const jsonMeds = JSON.stringify(data.medicines);
  if (data.id) {
    db.prepare('UPDATE templates SET name = ?, diagnosis = ?, medicines = ? WHERE id = ?').run(data.name, data.diagnosis, jsonMeds, data.id);
  } else {
    db.prepare('INSERT INTO templates (name, diagnosis, medicines) VALUES (?, ?, ?)').run(data.name, data.diagnosis, jsonMeds);
  }
  return { success: true };
});
ipcMain.handle('delete-template', (event, id) => { db.prepare('DELETE FROM templates WHERE id = ?').run(id); return { success: true }; });
ipcMain.handle('backup-data', async () => {
  const dbPath = path.join(app.getPath('userData'), 'clinic.db');
  if (!fs.existsSync(dbPath)) return { success: false, error: "Database file not found." };
  const dateStr = new Date().toLocaleString('sv-SE').split(' ')[0];
  const { filePath } = await dialog.showSaveDialog({ title: 'Save Backup File', defaultPath: `Clinic_Backup_${dateStr}.db`, filters: [{ name: 'Database Files', extensions: ['db'] }] });
  if (filePath) { fs.copyFileSync(dbPath, filePath); return { success: true, path: filePath }; }
  return { success: false, error: "Backup cancelled" };
});

// Add this inside your IPC HANDLERS section in main.js
ipcMain.handle('bulk-add-medicines', async (event, names) => {
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO inventory (name, default_dosage, default_duration, default_instruction) 
    VALUES (?, '', '', 'After Food')
  `);

  const transaction = db.transaction((namesList) => {
    let addedCount = 0;
    for (const name of namesList) {
      const cleanName = name.toUpperCase().trim();
      if (cleanName) {
        const info = insertStmt.run(cleanName);
        if (info.changes > 0) addedCount++;
      }
    }
    return addedCount;
  });

  try {
    const count = transaction(names);
    return { success: true, count };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// --- ADD THESE TO main.js ---

ipcMain.handle('update-patient', async (event, data) => {
  try {
    const stmt = db.prepare('UPDATE patients SET name = ?, age = ?, gender = ?, phone = ? WHERE id = ?');
    const info = stmt.run(data.name, data.age, data.gender, data.phone, data.id);
    return { success: info.changes > 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-patient', async (event, id) => {
  try {
    const transaction = db.transaction(() => {
      // 1. Delete all medicines inside prescriptions belonging to this patient
      db.prepare(`
        DELETE FROM prescription_items 
        WHERE prescription_id IN (SELECT id FROM prescriptions WHERE patient_id = ?)
      `).run(id);

      // 2. Delete the prescriptions themselves
      db.prepare('DELETE FROM prescriptions WHERE patient_id = ?').run(id);

      // 3. Delete certificates
      db.prepare('DELETE FROM certificates WHERE patient_id = ?').run(id);

      // 4. Finally, delete the patient
      db.prepare('DELETE FROM patients WHERE id = ?').run(id);
    });

    transaction(); // Execute the transaction
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

const createWindow = () => {
  const mainWindow = new BrowserWindow({ width: 1200, height: 800, webPreferences: { preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, nodeIntegration: false, contextIsolation: true } });
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};
app.on('ready', () => { setupDatabase(); createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });