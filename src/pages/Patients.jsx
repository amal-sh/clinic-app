import React, { useState, useEffect } from 'react';
import { Plus, User, Phone, Edit2, Trash2, X, Save, AlertTriangle } from 'lucide-react';
import { getLiveAge } from '../utils/ageHelper';

// Debounce helper
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const Patients = ({ onPatientSelect }) => {
  const [patients, setPatients] = useState([]);
  
  // Search / Add Inputs
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  const debouncedName = useDebounce(name, 300);
  const debouncedPhone = useDebounce(phone, 300);

  useEffect(() => {
    const query = debouncedName || debouncedPhone || '';
    loadPatients(query);
  }, [debouncedName, debouncedPhone]);

  const loadPatients = async (query = '') => {
    const data = await window.api.getPatients(query);
    setPatients(data);
  };

  const toTitleCase = (str) => str.replace(/\b\w/g, char => char.toUpperCase());
  const handleNameChange = (e) => setName(toTitleCase(e.target.value));

  // --- ADD PATIENT ---
  const handleAdd = async () => {
    const newPatient = { name, age, gender, phone };
    const result = await window.api.addPatient(newPatient);
    if (result.success) {
      setName(''); setAge(''); setPhone('');
      loadPatients(''); 
    } else {
      alert("Error: " + result.error);
    }
  };

  // --- DELETE LOGIC ---
  const confirmDelete = (e, patient) => {
    e.stopPropagation();
    setPatientToDelete(patient);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!patientToDelete) return;
    const result = await window.api.deletePatient(patientToDelete.id);
    if (result.success) {
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
      loadPatients(debouncedName || '');
    } else {
      alert("Delete failed: " + result.error);
    }
  };

  // --- EDIT LOGIC ---
  const openEditModal = (e, patient) => {
    e.stopPropagation();
    setEditingPatient({ ...patient }); 
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingPatient.name || !editingPatient.age) {
      alert("Name and Age are required.");
      return;
    }
    const result = await window.api.updatePatient(editingPatient);
    if (result.success) {
      setIsEditModalOpen(false);
      setEditingPatient(null);
      loadPatients(debouncedName || '');
    } else {
      alert("Update failed: " + result.error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isAddEnabled = name.trim() !== '' && age.trim() !== '' && gender !== '';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- QUICK ADD BAR (Standardized to match Medicines.jsx) --- */}
      <div style={topBarStyle}>
        
        {/* Name Input */}
        <div style={{ flex: 2 }}>
          <label style={labelStyle}>Name (Search / Add)</label>
          <div style={{ position: 'relative' }}>
            <User size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              className="form-input" style={{ paddingLeft: '40px', width: '100%' }}
              value={name} onChange={handleNameChange} 
              placeholder="Search or add..."
            />
          </div>
        </div>

        {/* Age Input */}
        <div style={{ width: '90px' }}>
          <label style={labelStyle}>Age</label>
          <input type="number" className="form-input" style={{ textAlign: 'center', width: '100%' }}
            value={age} onChange={(e) => setAge(e.target.value)}
            
          />
        </div>

        {/* Gender Select */}
        <div style={{ width: '110px' }}>
          <label style={labelStyle}>Gender</label>
          <select className="form-input" style={{ width: '100%' }} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>

        {/* Phone Input */}
        <div style={{ flex: 1.5 }}>
          <label style={labelStyle}>Phone</label>
          <div style={{ position: 'relative' }}>
            <Phone size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input className="form-input" style={{ paddingLeft: '40px', width: '100%' }}
              value={phone} onChange={(e) => setPhone(e.target.value)}
              
            />
          </div>
        </div>

        {/* Add Button */}
        <button 
          className="btn btn-primary" disabled={!isAddEnabled} onClick={handleAdd}
          style={{ height: '44px', opacity: isAddEnabled ? 1 : 0.6, cursor: isAddEnabled ? 'pointer' : 'not-allowed', minWidth: '110px', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}
        >
          <Plus size={18} /> ADD
        </button>
      </div>

      {/* --- PATIENT LIST --- */}
      <div className="table-container" style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th className="th-cell" style={{ width: '70px' }}>ID</th>
              <th className="th-cell">NAME</th>
              <th className="th-cell" style={{ width: '140px' }}>AGE / GENDER</th>
              <th className="th-cell">PHONE</th>
              <th className="th-cell" style={{ textAlign: 'right' }}>LAST VISIT</th>
              <th className="th-cell" style={{ width: '100px', textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} onClick={() => onPatientSelect(patient)} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>#{patient.id}</td>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>{patient.name}</td>
                <td style={{ padding: '14px 16px', color: '#334155' }}>{getLiveAge(patient)} Y / {patient.gender.charAt(0)}</td>
                <td style={{ padding: '14px 16px', color: '#64748b' }}>{patient.phone || '-'}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', color: '#64748b', fontSize: '13px' }}>{formatDate(patient.last_visit || patient.created_at)}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button className="icon-btn edit" onClick={(e) => openEditModal(e, patient)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn delete" onClick={(e) => confirmDelete(e, patient)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            
            {patients.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#cbd5e1' }}>
                  {name || phone ? (
                    <div>
                      <p style={{ color: '#64748b', fontWeight: 500 }}>No patient found.</p>
                      <p style={{ fontSize: '13px', color: '#94a3b8' }}>Fill Age & Gender to add "{name}" as a new patient.</p>
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8' }}>Loading recent patients...</p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && editingPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>Edit Patient</h3>
              <button className="icon-btn-close" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
            </div>

            <div className="modal-body">
              <div>
                <label className="input-label">Full Name</label>
                <input 
                  className="form-input" style={{ width: '100%' }}
                  value={editingPatient.name} 
                  onChange={(e) => setEditingPatient({...editingPatient, name: toTitleCase(e.target.value)})} 
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Age</label>
                  <input 
                    type="number" className="form-input" style={{ width: '100%' }}
                    value={editingPatient.age} 
                    onChange={(e) => setEditingPatient({...editingPatient, age: e.target.value})} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Gender</label>
                  <select 
                    className="form-input" style={{ width: '100%' }}
                    value={editingPatient.gender} 
                    onChange={(e) => setEditingPatient({...editingPatient, gender: e.target.value})} 
                  >
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Phone Number</label>
                <input 
                  className="form-input" style={{ width: '100%' }}
                  value={editingPatient.phone} 
                  onChange={(e) => setEditingPatient({...editingPatient, phone: e.target.value})} 
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-cancel" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleEditSave}><Save size={18} /> Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && patientToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '10px 0' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#1e293b' }}>Delete {patientToDelete.name}?</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                  This will permanently delete the patient and <b>ALL their prescriptions & medical history.</b> This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '24px' }}>
              <button className="btn btn-cancel" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={executeDelete}>
                <Trash2 size={18} /> Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        /* --- STANDARDIZED FORM STYLES --- */
        .form-input { 
          border: 1px solid #94a3b8 !important; 
          border-radius: 6px; 
          padding: 10px 12px; 
          font-size: 14px; 
          outline: none; 
          transition: 0.2s; 
          height: 42px; 
          box-sizing: border-box;
          color: #1e293b;
          font-weight: 500;
        }
        .form-input:focus { border-color: #0ea5e9 !important; box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15); }
        
        .input-label { fontSize: 13px; color: #475569; fontWeight: 700; marginBottom: 6px; display: block; }
        
        .th-cell { 
          text-align: left; padding: 14px 16px; color: #475569; 
          fontSize: 12px; fontWeight: 700; text-transform: uppercase; 
        }
        
        /* --- ACTION BUTTONS --- */
        .icon-btn { 
          border: 1px solid transparent; 
          background: transparent; 
          padding: 8px; 
          border-radius: 8px; 
          cursor: pointer; 
          transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center;
        }
        
        .icon-btn.edit { color: #3b82f6; }
        .icon-btn.edit:hover { 
          background: #eff6ff; 
          border-color: #dbeafe; 
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
          transform: scale(1.1);
        }

        .icon-btn.delete { color: #ef4444; }
        .icon-btn.delete:hover { 
          background: #fef2f2; 
          border-color: #fee2e2;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);
          transform: scale(1.1);
        }
        
        /* --- CANCEL BUTTON (GHOST STYLE) --- */
        .btn-cancel {
          background-color: white;
          color: #475569; border: 1px solid #cbd5e1;
          padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
        }
        .btn-cancel:hover {
          background-color: #f1f5f9; color: #1e293b; border-color: #94a3b8;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        /* --- ROW HOVER --- */
        .hover-row:hover { background-color: #f0f9ff !important; border-left: 3px solid #0ea5e9; }

        /* --- MODAL STYLES --- */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(15, 23, 42, 0.65);
          display: flex; justify-content: center; align-items: center;
          z-index: 2000; backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          background-color: white; 
          border-radius: 16px; 
          width: 450px; 
          padding: 24px; 
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid #e2e8f0;
          display: flex; flex-direction: column;
          transform: scale(1);
          animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .delete-modal { width: 400px; }

        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #f1f5f9; }
        .modal-body { display: flex; flex-direction: column; gap: 16px; }
        .modal-footer { display: flex; gap: 12px; margin-top: 24px; padding-top: 15px; border-top: 1px solid #f1f5f9; }

        .icon-btn-close { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 6px; border-radius: 50%; transition: 0.2s; }
        .icon-btn-close:hover { background: #f1f5f9; color: #1e293b; }

        .btn-danger {
          background-color: #ef4444; color: white; border: none; padding: 10px 20px;
          border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-danger:hover { background-color: #dc2626; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

// Use exact same style object as Medicines.jsx for perfect match
const topBarStyle = { 
  backgroundColor: 'white', padding: '24px', borderRadius: '12px', 
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', 
  marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'flex-end' 
};
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' };

export default Patients;