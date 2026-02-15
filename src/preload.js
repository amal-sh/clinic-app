const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // --- Patients ---
  addPatient: (data) => ipcRenderer.invoke('add-patient', data),
  getPatients: (query) => ipcRenderer.invoke('get-patients', query),
  
  // --- Prescriptions ---
  savePrescription: (data) => ipcRenderer.invoke('save-prescription', data),
  
  // --- Inventory ---
  getInventory: () => ipcRenderer.invoke('get-inventory'),
  
  // --- Printing ---
  printPrescription: (html) => ipcRenderer.invoke('print-prescription', html),
  
  // --- History (Rx + Certificates) ---
  getPatientHistory: (id) => ipcRenderer.invoke('get-patient-history', id),
  getPrescriptionDetails: (id) => ipcRenderer.invoke('get-prescription-details', id),
  
  // --- Certificates (NEW) ---
  saveCertificate: (data) => ipcRenderer.invoke('save-certificate', data),

  // ... existing functions ...
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (data) => ipcRenderer.invoke('save-settings', data),

  // ... existing inventory functions ...
  deleteMedicine: (id) => ipcRenderer.invoke('delete-medicine', id),
  updateMedicine: (data) => ipcRenderer.invoke('update-medicine', data),
  addMedicine: (data) => ipcRenderer.invoke('add-medicine', data),

  // ... existing functions ...
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),

  // ... existing functions ...
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  saveTemplate: (data) => ipcRenderer.invoke('save-template', data),
  deleteTemplate: (id) => ipcRenderer.invoke('delete-template', id),

  backupData: () => ipcRenderer.invoke('backup-data'),

  // Add this line inside contextBridge.exposeInMainWorld in preload.js
bulkAddMedicines: (names) => ipcRenderer.invoke('bulk-add-medicines', names),

// --- ADD THESE TO preload.js ---
updatePatient: (data) => ipcRenderer.invoke('update-patient', data),
deletePatient: (id) => ipcRenderer.invoke('delete-patient', id),
});