import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Database, AlertCircle, Building2, MapPin, Phone, Mail, Printer } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    clinicName: '',
    doctorName: '',
    qualification: '',
    speciality: '',
    regNumber: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    paperSize: 'A4'
  });
  
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await window.api.getSettings();
    setSettings(prev => ({ ...prev, ...data }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleSave = async () => {
    const result = await window.api.saveSettings(settings);
    if (result.success) {
      showToast('Settings updated successfully', 'success');
    } else {
      showToast('Update failed', 'error');
    }
  };

  const handleBackup = async () => {
    const result = await window.api.backupData();
    if (result.success) {
      showToast('Backup saved successfully', 'success');
    } else if (result.error !== "Backup cancelled") {
      showToast(result.error, 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Settings</h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Manage your clinic profile and system data.</p>
        </header>

        {/* --- SECTION 1: CLINIC PROFILE --- */}
        <section style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={iconBoxStyle}><Building2 size={20} color="#3b82f6" /></div>
            <div>
              <h3 style={sectionTitleStyle}>Doctor & Clinic Details</h3>
              <p style={sectionSubTitleStyle}>This information is used for the prescription header.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Clinic Name</label>
              <input name="clinicName" value={settings.clinicName} onChange={handleChange} className="form-input" placeholder="e.g. City Care Hospital" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Doctor Name</label>
                <input name="doctorName" value={settings.doctorName} onChange={handleChange} className="form-input" placeholder="Dr. John Doe" />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Registration Number</label>
                <input name="regNumber" value={settings.regNumber} onChange={handleChange} className="form-input" placeholder="e.g. Reg No: 12345" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Qualification</label>
                <input name="qualification" value={settings.qualification} onChange={handleChange} className="form-input" placeholder="e.g. MBBS, MD" />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Speciality</label>
                <input name="speciality" value={settings.speciality} onChange={handleChange} className="form-input" placeholder="e.g. General Physician" />
              </div>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Address</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="#64748b" style={{ ...innerIconStyle, top: '12px' }} />
                <textarea name="address" value={settings.address} onChange={handleChange} className="form-input icon-padding" rows="2" placeholder="Full clinic address..." />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="#64748b" style={innerIconStyle} />
                  <input name="phone" value={settings.phone} onChange={handleChange} className="form-input icon-padding" placeholder="+91 00000 00000" />
                </div>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#64748b" style={innerIconStyle} />
                  <input name="email" value={settings.email} onChange={handleChange} className="form-input icon-padding" placeholder="doctor@clinic.com" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: PRINT PREFERENCES --- */}
        <section style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ ...iconBoxStyle, backgroundColor: '#f0fdf4' }}><Printer size={20} color="#16a34a" /></div>
            <div>
              <h3 style={sectionTitleStyle}>Print Preferences</h3>
              <p style={sectionSubTitleStyle}>Choose your preferred paper size for printing.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <label className={`radio-card ${settings.paperSize === 'A4' ? 'active' : ''}`}>
              <input type="radio" name="paperSize" value="A4" checked={settings.paperSize === 'A4'} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
              <div>
                <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>A4 Paper</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Standard Full Page</span>
              </div>
            </label>

            <label className={`radio-card ${settings.paperSize === 'A5' ? 'active' : ''}`}>
              <input type="radio" name="paperSize" value="A5" checked={settings.paperSize === 'A5'} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
              <div>
                <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>A5 Paper</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Half Page</span>
              </div> 
            </label>
          </div>

          <div style={{ marginTop: '32px', borderTop: '1px solid #f1f5f9', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSave} className="btn-primary">
              <Save size={18} /> Save Settings
            </button>
          </div>
        </section>

        {/* --- SECTION 3: DATA & BACKUP --- */}
        <section style={{ ...sectionCardStyle, border: '1px solid #e2e8f0' }}>
          <div style={sectionHeaderStyle}>
            <div style={{ ...iconBoxStyle, backgroundColor: '#fef3c7' }}><Database size={20} color="#d97706" /></div>
            <div>
              <h3 style={sectionTitleStyle}>Data Management</h3>
              <p style={sectionSubTitleStyle}>Secure your database by exporting a backup file.</p>
            </div>
          </div>
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Database size={24} color="#d97706" style={{ marginTop: '2px' }} />
              <div>
                <span style={{ display: 'block', fontWeight: 700, color: '#92400e', fontSize: '15px', marginBottom: '4px' }}>Regular Backups</span>
                <span style={{ fontSize: '13px', color: '#b45309', lineHeight: '1.5' }}>Recommended once a week to an external drive.</span>
              </div>
            </div>
            <button onClick={handleBackup} className="btn-warning">Export Database</button>
          </div>
        </section>
      </div>

      {/* MODERN TOAST MESSAGES */}
      {toast && (
        <div className={`toast-notification ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          <div className="toast-icon">
            {toast.type === 'success' ? <CheckCircle size={22} color="white" /> : <AlertCircle size={22} color="white" />}
          </div>
          <span>{toast.message}</span>
        </div>
      )}

      <style>{`
        /* --- INPUT STYLES --- */
        .form-input { 
          width: 100%; box-sizing: border-box; padding: 12px 14px; 
          border: 1px solid #94a3b8; border-radius: 8px; 
          font-size: 15px; color: #1e293b; outline: none; background-color: white; 
          transition: all 0.2s;
        }
        .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .icon-padding { padding-left: 42px; }

        /* --- BUTTON STYLES --- */
        .btn-primary {
          background-color: #3b82f6; color: white; border: none; 
          padding: 12px 32px; border-radius: 10px; font-weight: 600; 
          cursor: pointer; display: flex; align-items: center; gap: 8px; 
          transition: all 0.2s;
        }
        .btn-primary:hover { background-color: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }

        .btn-warning {
          background-color: #d97706; color: white; padding: 12px 24px; 
          font-size: 14px; font-weight: 700; border: none; 
          border-radius: 10px; cursor: pointer; flex-shrink: 0; 
          transition: all 0.2s;
        }
        .btn-warning:hover { background-color: #b45309; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(180, 83, 9, 0.2); }

        /* --- RADIO CARD (FIXED CSS SYNTAX) --- */
        .radio-card {
          flex: 1; 
          cursor: pointer; 
          padding: 16px; 
          border-radius: 12px; 
          border: 2px solid #e2e8f0;
          background-color: white; 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          transition: all 0.2s;
        }
        .radio-card.active { border-color: #3b82f6; background-color: #eff6ff; }

        /* --- TOAST STYLES --- */
        .toast-notification {
          position: fixed; bottom: 24px; right: 24px; padding: 16px 24px; border-radius: 12px;
          color: white; display: flex; align-items: center; gap: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 9999; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          font-weight: 600; font-size: 14px; min-width: 300px;
        }
        .toast-success { background-color: #10b981; border: 1px solid #059669; }
        .toast-error { background-color: #f43f5e; border: 1px solid #e11d48; }

        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

const sectionCardStyle = { backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '32px' };
const sectionHeaderStyle = { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' };
const iconBoxStyle = { width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const sectionTitleStyle = { margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' };
const sectionSubTitleStyle = { margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' };
const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px' };
const formGroupStyle = { marginBottom: '4px' };
const innerIconStyle = { position: 'absolute', left: '12px', top: '12px', zIndex: 1 };

export default Settings;