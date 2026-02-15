import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Save, Pill, CheckCircle, X, RotateCcw, AlertTriangle, ListPlus, MoreVertical, Info, AlertCircle } from 'lucide-react';

const PREFIX_REGEX = /^(?:(?:TAB|CAP|SYR|INJ|OINT|GEL|CRM|SOL|SUSP|DRP|GTT|PWDR)\.?\s*|(?:T|C|S|I)(?:\.|\s)\s*)/i;

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [duration, setDuration] = useState('');
  const [instruction, setInstruction] = useState('After Food');

  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showDosageDropdown, setShowDosageDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const dosageRef = useRef(null);
  const moreMenuRef = useRef(null);
  const dosageOptions = ["1-0-1", "1-0-0", "0-0-1", "0-1-0", "1-1-1", "1-1-0", "0-1-1", "SOS", "ONCE A WEEK", "ONCE A MONTH"];

  useEffect(() => {
    loadMedicines();
    const handleClickOutside = (event) => {
      if (dosageRef.current && !dosageRef.current.contains(event.target)) setShowDosageDropdown(false);
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) setShowMoreMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadMedicines = async () => {
    const data = await window.api.getInventory();
    setMedicines(data);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const finalDuration = duration && !isNaN(duration) ? `${duration} Days` : duration;
    const payload = { name: name.toUpperCase(), dosage, duration: finalDuration, instruction };

    let result;
    if (editingId) {
      result = await window.api.updateMedicine({ id: editingId, ...payload });
      if (result.success) { showToast("Medicine Updated", "success"); handleCancelEdit(); }
    } else {
      result = await window.api.addMedicine(payload);
      if (result.success) {
        showToast("Medicine Added", "success");
        setName(''); setDosage(''); setDuration('');
      }
    }
    if (result.success) loadMedicines();
    else showToast(result.error, "error");
  };

  const handleBulkSave = async () => {
    const names = bulkText.split('\n').filter(n => n.trim() !== '');
    if (names.length === 0) return;
    const result = await window.api.bulkAddMedicines(names);
    if (result.success) {
      showToast(`Added ${result.count} new medicines`, "success");
      setBulkText(''); setShowBulkModal(false); loadMedicines();
    } else showToast("Bulk add failed", "error");
  };

  const handleEdit = (med) => {
    setEditingId(med.id);
    setName(med.name);
    setDosage(med.default_dosage || '');
    setDuration(med.default_duration ? med.default_duration.replace(' Days', '').trim() : '');
    setInstruction(med.default_instruction || 'After Food');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName(''); setDosage(''); setDuration(''); setInstruction('After Food');
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredMeds = medicines.filter(m => {
    if (!name) return true;
    const searchKey = name.toUpperCase().replace(PREFIX_REGEX, '').trim();
    const dbNameClean = m.name.toUpperCase().replace(PREFIX_REGEX, '').trim();
    return dbNameClean.startsWith(searchKey);
  });

  const bulkCount = bulkText.split('\n').filter(n => n.trim() !== '').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* TOP BAR */}
      <div style={topBarStyle}>
        <div style={{ flex: 2 }}>
          <label style={labelStyle}>{editingId ? 'Edit Medicine Name' : 'Medicine Name'}</label>
          <div style={{ position: 'relative' }}>
            <Pill size={18} color={editingId ? "#f59e0b" : "#64748b"} style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input className="form-input" style={{ paddingLeft: '40px', width: '100%' }} value={name} onChange={(e) => setName(e.target.value.toUpperCase())} placeholder="Search or add..." autoComplete="off" />
          </div>
        </div>

        <div style={{ width: '120px', position: 'relative' }} ref={dosageRef}>
          <label style={labelStyle}>Dosage</label>
          <input className="form-input" style={{ width: '100%' }} value={dosage} onChange={(e) => setDosage(e.target.value)} onFocus={() => setShowDosageDropdown(true)} placeholder="1-0-1" autoComplete="off" />
          {showDosageDropdown && (
            <ul className="custom-dropdown">
              {dosageOptions.filter(d => d.startsWith(dosage)).map((opt, i) => (
                <li key={i} onMouseDown={() => { setDosage(opt); setShowDosageDropdown(false); }}>{opt}</li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ width: '110px' }}>
          <label style={labelStyle}>Duration</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid #94a3b8', borderRadius: '6px', padding: '0 8px', backgroundColor: 'white', height: '42px' }}>
            <input type="number" style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', textAlign: 'center' }} placeholder="0" value={duration} onChange={(e) => setDuration(e.target.value)} />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>DAYS</span>
          </div>
        </div>

        <div style={{ width: '140px' }}>
          <label style={labelStyle}>Instruction</label>
          <select className="form-input" style={{ width: '100%' }} value={instruction} onChange={(e) => setInstruction(e.target.value)}>
            <option>After Food</option><option>Before Food</option><option>With Food</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', position: 'relative' }} ref={moreMenuRef}>
          {editingId && (
            <button className="btn btn-secondary" onClick={handleCancelEdit} style={{ height: '44px' }}><RotateCcw size={18} /></button>
          )}
          <button className={`btn ${editingId ? 'btn-warning' : 'btn-primary'}`} disabled={!name.trim()} onClick={handleSave} style={{ height: '44px', minWidth: '100px' }}>
            {editingId ? <><Save size={18} /> UPDATE</> : <><Plus size={18} /> ADD</>}
          </button>
          
          <button className="btn btn-secondary" onClick={() => setShowMoreMenu(!showMoreMenu)} style={{ height: '44px', padding: '0 8px' }}>
            <MoreVertical size={20} />
          </button>

          {showMoreMenu && (
            <div className="more-dropdown">
              <button className="dropdown-item" onClick={() => { setShowBulkModal(true); setShowMoreMenu(false); }}>
                <ListPlus size={16} /> Bulk Add Medicines
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MEDICINE LIST */}
      <div className="table-container" style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>MEDICINE NAME</th>
              <th style={thStyle}>DOSAGE</th>
              <th style={thStyle}>DURATION</th>
              <th style={thStyle}>INSTRUCTION</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '100px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeds.map((med) => (
              <tr 
                key={med.id} 
                style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: editingId === med.id ? '#fffbeb' : 'white' }} 
                className="hover-row"
              >
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{med.name}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{med.default_dosage || '-'}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{med.default_duration || '-'}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{med.default_instruction || '-'}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button className="icon-btn edit" onClick={() => handleEdit(med)} style={{ color: editingId === med.id ? '#d97706' : '#64748b' }}><Edit2 size={16} /></button>
                    <button className="icon-btn delete" onClick={() => setDeleteId(med.id)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BULK ADD MODAL */}
      {showBulkModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, width: '550px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', backgroundColor: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><ListPlus size={20} /></div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>Bulk Add Medicines</h3>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowBulkModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '10px', backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '20px' }}>
                <Info size={18} color="#0369a1" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '13px', color: '#0369a1', lineHeight: '1.5' }}>Paste or type medicine names below (one per line). Existing entries are skipped.</p>
              </div>
              <div style={{ position: 'relative' }}>
                <textarea style={textareaStyle} rows="10"  value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{bulkCount} Medicines Detected</div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-cancel" onClick={() => setShowBulkModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={bulkCount === 0} onClick={handleBulkSave}><Plus size={18} /> Add All</button>
            </div>
          </div>
        </div>
      )}

      {/* IMPROVED DELETE MODAL */}
      {deleteId && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, width: '400px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '10px 0' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#1e293b' }}>Delete Medicine?</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                  Are you sure you want to remove this medicine from inventory?
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
              <button className="btn-cancel" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={async () => { await window.api.deleteMedicine(deleteId); setDeleteId(null); loadMedicines(); showToast("Medicine Deleted", "success"); }}>
                <Trash2 size={18} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
        .form-input { border: 1px solid #94a3b8 !important; border-radius: 6px; padding: 10px 12px; font-size: 14px; outline: none; transition: 0.2s; height: 42px;  }
        .form-input:focus { border-color: #0ea5e9 !important; box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15); }
        
        .hover-row { transition: background-color 0.15s ease; }
        .hover-row:hover { background-color: #f0f9ff !important; border-left: 3px solid #0ea5e9; }
        
        .icon-btn { border: none; background: none; cursor: pointer; padding: 6px; border-radius: 6px; transition: background 0.2s; }
        .icon-btn.edit:hover { background-color: #e0f2fe; color: #0284c7; }
        .icon-btn.delete:hover { background-color: #fee2e2; }
        
        .custom-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #f0f9ff; border: 1.5px solid #0ea5e9; border-radius: 6px; list-style: none; padding: 0; margin: 4px 0 0 0; z-index: 100; max-height: 200px; overflow-y: auto; }
        .custom-dropdown li { padding: 10px 12px; font-size: 14px; cursor: pointer; border-bottom: 1px solid #dbeafe; }
        .custom-dropdown li:hover { background-color: #e0f2fe; color: #0ea5e9; }
        
        .more-dropdown { position: absolute; top: 100%; right: 0; width: 220px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); z-index: 101; margin-top: 8px; padding: 6px; }
        .dropdown-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: none; background: none; cursor: pointer; font-size: 14px; color: #475569; border-radius: 6px; font-weight: 500; }
        .dropdown-item:hover { background-color: #eff6ff; color: #3b82f6; }

        /* --- BUTTON STYLES --- */
        .btn-cancel {
          background-color: white; color: #475569; border: 1px solid #cbd5e1;
          padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
        }
        .btn-cancel:hover { background-color: #f1f5f9; color: #1e293b; border-color: #94a3b8; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

        .btn-danger {
          background-color: #ef4444; color: white; border: none; padding: 10px 20px;
          border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-danger:hover { background-color: #dc2626; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3); }

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

const topBarStyle = { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'flex-end' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' };
const thStyle = { textAlign: 'left', padding: '14px 16px', color: '#475569', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' };
const textareaStyle = { width: '100%', padding: '16px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', resize: 'none', backgroundColor: '#fcfcfd', transition: 'border-color 0.2s', boxSizing: 'border-box' };

export default Medicines;