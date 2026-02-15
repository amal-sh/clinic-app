import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Save, FileText, X, CheckCircle, Search, Pill, AlertTriangle, AlertCircle, Zap } from 'lucide-react';

const PREFIX_REGEX = /^(?:(?:TAB|CAP|SYR|INJ|OINT|GEL|CRM|SOL|SUSP|DRP|GTT|PWDR)\.?\s*|(?:T|C|S|I)(?:\.|\s)\s*)/i;

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [fullInventory, setFullInventory] = useState([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '', instruction: 'After Food' }]);
  const [toast, setToast] = useState(null);
  const [activeSearch, setActiveSearch] = useState({ row: null, field: null });

  const diagnosisRef = useRef(null);
  const dosageOptions = ["1-0-1", "1-0-0", "0-0-1", "0-1-0", "1-1-1", "1-1-0", "0-1-1", "SOS", "ONCE A WEEK", "ONCE A MONTH"];

  useEffect(() => {
    loadData();
    const handleClickOutside = () => setActiveSearch({ row: null, field: null });
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredTemplates(templates);
    } else {
      const lowerSearch = search.toLowerCase();
      setFilteredTemplates(templates.filter(t => t.diagnosis.toLowerCase().includes(lowerSearch)));
    }
  }, [search, templates]);

  const loadData = async () => {
    const tData = await window.api.getTemplates();
    const parsed = tData.map(t => ({ ...t, medicines: JSON.parse(t.medicines) }));
    setTemplates(parsed);
    setFilteredTemplates(parsed);
    const invData = await window.api.getInventory();
    setFullInventory(invData);
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getFilteredMedicines = (input) => {
    if (!input) return [];
    const searchKey = input.toUpperCase().replace(PREFIX_REGEX, '').trim(); 
    return fullInventory.filter(item => {
      const dbNameClean = item.name.toUpperCase().replace(PREFIX_REGEX, '').trim();
      return dbNameClean.startsWith(searchKey);
    });
  };

  const selectMedicine = (index, item) => {
    const updated = [...medicines];
    updated[index].name = item.name;
    updated[index].dosage = item.default_dosage || '';
    updated[index].duration = (item.default_duration || '').replace(/ Days/i, '').trim();
    updated[index].instruction = item.default_instruction || 'After Food';
    setMedicines(updated);
    setActiveSearch({ row: null, field: null });
  };

  const handleSave = async () => {
    if (!diagnosis.trim()) { showToast("Diagnosis name is required", "error"); return; }
    const cleanMeds = medicines.filter(m => m.name.trim() !== '');
    const finalMeds = cleanMeds.map(m => ({
      ...m,
      duration: m.duration && !isNaN(m.duration) ? `${m.duration} Days` : m.duration
    }));
    const payload = { id: editingId, name: diagnosis, diagnosis, medicines: finalMeds };
    const result = await window.api.saveTemplate(payload);
    if (result.success) {
      showToast("Template Saved Successfully", "success");
      setIsModalOpen(false);
      loadData(); 
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* HEADER */}
      <div style={{ padding: '24px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <FileText size={20} />
          </div>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b', fontWeight: 700 }}>Templates</h2>
          <div style={{ position: 'relative', marginLeft: '30px', width: '300px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input className="form-input" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: '36px', height: '40px' }} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setDiagnosis(''); setMedicines([{ name: '', dosage: '', duration: '', instruction: 'After Food' }]); setIsModalOpen(true); }}>
          <Plus size={18} /> Create New Template
        </button>
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredTemplates.map((t) => (
            <div key={t.id} className="template-card-new">
              <div className="card-top">
                <div className="card-info">
                  <h3 className="card-title">{t.diagnosis}</h3>
                  <span className="card-count">{t.medicines.length} Medicines</span>
                </div>
                <div className="card-actions">
                  <button className="btn-action edit" onClick={() => {
                    setEditingId(t.id);
                    setDiagnosis(t.diagnosis);
                    setMedicines(t.medicines.length > 0 ? t.medicines : [{ name: '', dosage: '', duration: '', instruction: 'After Food' }]);
                    setIsModalOpen(true);
                  }}>
                    <Edit2 size={14} /> <span>Edit</span>
                  </button>
                  <button className="btn-action delete" onClick={() => setDeleteId(t.id)}>
                    <Trash2 size={14} /> <span>Delete</span>
                  </button>
                </div>
              </div>
              <div className="card-bottom">
                {t.medicines.length > 0 ? (
                  <div className="medicine-pill-container">
                    {t.medicines.map((m, i) => (
                      <div key={i} className="medicine-pill">
                        <Pill size={12} className="text-slate-400" />
                        <span className="pill-name">{m.name}</span>
                        <span className="pill-dosage">{m.dosage}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="no-meds-text">No medicines defined for this template</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Template' : 'New Template'}</h3>
              <button className="icon-btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Diagnosis Name</label>
              <input className="form-input" style={{ width: '100%', fontSize: '16px' }} value={diagnosis} onChange={e => setDiagnosis(toTitleCase(e.target.value))} placeholder="Enter diagnosis..." />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '24px', overflow: 'visible' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr><th style={thStyle}>Medicine</th><th style={thStyle}>Dosage</th><th style={thStyle}>Duration</th><th style={thStyle}>Instruction</th><th style={{ width: '40px' }}></th></tr>
                </thead>
                <tbody>
                  {medicines.map((med, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', position: 'relative' }}>
                        <input className="form-input w-full" value={med.name} onChange={e => {
                          const val = e.target.value.toUpperCase();
                          const updated = [...medicines];
                          updated[i].name = val;
                          if (i === medicines.length - 1 && val.trim()) updated.push({ name: '', dosage: '', duration: '', instruction: 'After Food' });
                          setMedicines(updated);
                          setActiveSearch({ row: i, field: 'name' });
                        }} onClick={e => { e.stopPropagation(); setActiveSearch({ row: i, field: 'name' }); }} placeholder="Search..." autoComplete="off" />
                        {activeSearch.row === i && activeSearch.field === 'name' && med.name && (
                          <ul className="custom-dropdown">
                            {getFilteredMedicines(med.name).map((item, idx) => (
                              <li key={idx} onMouseDown={(e) => { e.preventDefault(); selectMedicine(i, item); }}>{item.name}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', position: 'relative' }}>
                          <input className="form-input w-full" value={med.dosage} onChange={e => {
                            const updated = [...medicines];
                            updated[i].dosage = e.target.value;
                            setMedicines(updated);
                            setActiveSearch({ row: i, field: 'dosage' });
                          }} onClick={e => { e.stopPropagation(); setActiveSearch({ row: i, field: 'dosage' }); }} placeholder="1-0-1" autoComplete="off" />
                          {activeSearch.row === i && activeSearch.field === 'dosage' && (
                          <ul className="custom-dropdown">
                            {dosageOptions.filter(d => d.startsWith(med.dosage)).map((opt, idx) => (
                              <li key={idx} onMouseDown={(e) => { e.preventDefault(); const updated = [...medicines]; updated[i].dosage = opt; setMedicines(updated); setActiveSearch({ row: null, field: null }); }}>{opt}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input type="number" className="form-input" style={{ width: '60px' }} value={med.duration} onChange={e => {
                            const updated = [...medicines];
                            updated[i].duration = e.target.value;
                            setMedicines(updated);
                          }} />
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Days</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <select className="form-input w-full" value={med.instruction} onChange={e => {
                          const updated = [...medicines];
                          updated[i].instruction = e.target.value;
                          setMedicines(updated);
                        }}>
                          <option>After Food</option><option>Before Food</option><option>With Food</option>
                        </select>
                      </td>
                      <td>
                        {medicines.length > 1 && <button className="icon-btn-delete-row" onClick={() => setMedicines(medicines.filter((_, idx) => idx !== i))}><Trash2 size={16} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn-add-row" onClick={() => setMedicines([...medicines, { name: '', dosage: '', duration: '', instruction: 'After Food' }])}><Plus size={16} /> Add Another Medicine</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}><Save size={18} /> Save Template</button>
            </div>
          </div>
        </div>
      )}

      {/* IMPROVED DELETE MODAL */}
      {deleteId && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, width: '400px', height: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '10px 0' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#1e293b' }}>Delete Template?</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                  Are you sure you want to remove this template? This action cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
              <button className="btn-cancel" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={async () => { await window.api.deleteTemplate(deleteId); setDeleteId(null); loadData(); showToast("Template Deleted", "success"); }}>
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
        /* DARKENED BORDERS FOR BETTER VISIBILITY */
        .form-input { 
          border: 1px solid #64748b !important; 
          border-radius: 8px; 
          padding: 8px 12px; 
          font-size: 14px; 
          outline: none; 
          transition: all 0.2s; 
          background: white;
        }
        .form-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        
        .template-card-new {
          background: white; border-radius: 12px; border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;
          border-left: 4px solid #3b82f6; overflow: hidden;
        }
        .template-card-new:hover { border-color: #3b82f6; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-1px); }
        .card-top { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
        .card-title { margin: 0; font-size: 18px; color: #1e293b; font-weight: 700; }
        .card-count { font-size: 11px; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; margin-top: 4px; display: inline-block; }
        
        /* ENSURE BUTTONS ARE IN ONE LINE */
        .card-actions { display: flex; flex-direction: row; gap: 10px; align-items: center; }

        .btn-action {
          display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; background: #f8fafc;
        }
        .btn-action.edit { color: #3b82f6; border-color: #dbeafe; }
        .btn-action.edit:hover { background: #3b82f6; color: white; border-color: #3b82f6; transform: scale(1.05); box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1); }
        
        .btn-action.delete { color: #ef4444; border-color: #fee2e2; }
        .btn-action.delete:hover { background: #ef4444; color: white; border-color: #ef4444; transform: scale(1.05); box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1); }

        .card-bottom { padding: 16px 20px; background: #fafafa; }
        .medicine-pill-container { display: flex; flex-wrap: wrap; gap: 8px; }
        .medicine-pill { 
          display: flex; align-items: center; gap: 6px; background: white; 
          border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 6px; font-size: 13px;
        }
        .pill-name { font-weight: 700; color: #334155; }
        .pill-dosage { color: #0ea5e9; font-weight: 800; font-size: 11px; background: #f0f9ff; padding: 1px 4px; border-radius: 3px; }
        .no-meds-text { font-size: 13px; color: #94a3b8; font-style: italic; }

        /* LIGHT BLUE SKY THEME DROPDOWN WITH NO GAP */
        .custom-dropdown { 
          position: absolute; left: 0; right: 0; background: #f0f9ff; 
          border: 1.5px solid #0ea5e9; border-radius: 0 0 6px 6px; padding: 0; margin: 0; 
          z-index: 100; max-height: 180px; overflow-y: auto; list-style: none;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); top: 100%;
        }
        .custom-dropdown li { padding: 10px 12px; font-size: 14px; cursor: pointer; color: #334155; border-bottom: 1px solid #dbeafe; }
        .custom-dropdown li:hover { background-color: #e0f2fe; color: #0ea5e9; }
        
        .btn-add-row { width: 100%; padding: 12px; background: #f8fafc; border: none; border-top: 1px solid #e2e8f0; color: #3b82f6; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        
        .icon-btn-close { background: none; border: none; cursor: pointer; color: #64748b; padding: 8px; border-radius: 8px; transition: 0.2s; }
        .icon-btn-close:hover { background: #f1f5f9; color: #1e293b; }
        .icon-btn-delete-row { background: none; border: none; cursor: pointer; color: #94a3b8; transition: 0.2s; }
        .icon-btn-delete-row:hover { color: #ef4444; }

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

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', borderRadius: '16px', width: '900px', height: '80vh', padding: '32px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const thStyle = { textAlign: 'left', padding: '12px 14px', fontSize: '12px', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' };

export default Templates;