import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Printer, Save, Trash2, CheckCircle, Eye, X, Zap, AlertCircle } from 'lucide-react';
import { generatePrescriptionHTML } from '../utils/printTemplate';

const PREFIX_REGEX = /^(?:(?:TAB|CAP|SYR|INJ|OINT|GEL|CRM|SOL|SUSP|DRP|GTT|PWDR)\.?\s*|(?:T|C|S|I)(?:\.|\s)\s*)/i;

const Prescription = ({ patient, onBack, hideHeader, initialData, onDataLoaded }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', duration: '', instruction: 'After Food' }
  ]);
   
  const [fullInventory, setFullInventory] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [settings, setSettings] = useState({});

  const [toast, setToast] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [activeSearch, setActiveSearch] = useState({ row: null, field: null });
  const [showDiagSuggestions, setShowDiagSuggestions] = useState(false);

  const diagnosisRef = useRef(null);

  const dosageOptions = ["1-0-1", "1-0-0", "0-0-1", "0-1-0", "1-1-1", "1-1-0", "0-1-1", "SOS", "ONCE A WEEK", "ONCE A MONTH"];
  const instructionOptions = ["After Food", "Before Food", "With Food"];

  useEffect(() => {
    loadData();
    const handleClickOutside = () => {
      setActiveSearch({ row: null, field: null });
      setShowDiagSuggestions(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialData) {
      setDiagnosis(initialData.diagnosis || '');
      const importedMeds = initialData.medicines && initialData.medicines.length > 0 
        ? initialData.medicines 
        : [{ name: '', dosage: '', duration: '', instruction: 'After Food' }];
      
      const cleanMeds = importedMeds.map(m => ({
        ...m,
        duration: m.duration ? String(m.duration).replace(/ Days/gi, '').trim() : ''
      }));

      setMedicines([...cleanMeds, { name: '', dosage: '', duration: '', instruction: 'After Food' }]);
      if (onDataLoaded) onDataLoaded();
    }
  }, [initialData, onDataLoaded]);

  const loadData = async () => {
    const inv = await window.api.getInventory();
    setFullInventory(inv);
    const sett = await window.api.getSettings();
    setSettings(sett);
    const temps = await window.api.getTemplates();
    setAllTemplates(temps);
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleDiagnosisChange = (val) => {
    setDiagnosis(toTitleCase(val));
    setShowDiagSuggestions(true);
  };

  const getCurrentSearchTerm = () => {
    const parts = diagnosis.split(',');
    return parts[parts.length - 1].trim().toUpperCase();
  };

  const filteredTemplates = allTemplates.filter(t => {
    const searchTerm = getCurrentSearchTerm();
    if (!searchTerm) return false; 
    const words = t.diagnosis.toUpperCase().split(/\s+/);
    return words.some(w => w.startsWith(searchTerm));
  });

  const applyTemplate = (template) => {
    const parts = diagnosis.split(',');
    parts.pop();
    const existing = parts.map(p => p.trim()).filter(p => p);
    const newDiagnosisStr = [...existing, template.diagnosis].join(', ') + ', ';
    setDiagnosis(newDiagnosisStr);

    try {
      let templateMeds = JSON.parse(template.medicines);
      templateMeds = templateMeds.map(m => ({
        ...m,
        duration: m.duration ? m.duration.replace(/ Days/gi, '').trim() : ''
      }));

      setMedicines(prevMeds => {
        const validPrev = prevMeds.filter(m => m.name.trim() !== '');
        const existingNames = new Set(validPrev.map(m => m.name.toUpperCase()));
        const medsToAdd = [];
        templateMeds.forEach(newMed => {
          if (!existingNames.has(newMed.name.toUpperCase())) {
            medsToAdd.push(newMed);
          }
        });
        return [...validPrev, ...medsToAdd, { name: '', dosage: '', duration: '', instruction: 'After Food' }];
      });
    } catch (e) { console.error("Error parsing template", e); }
    
    setShowDiagSuggestions(false);
    if (diagnosisRef.current) diagnosisRef.current.focus();
  };

  const getFilteredMedicines = (input) => {
    if (!input) return [];
    const searchKey = input.toUpperCase().replace(PREFIX_REGEX, '').trim(); 
    return fullInventory.filter(item => {
      const dbNameClean = item.name.toUpperCase().replace(PREFIX_REGEX, '').trim();
      return dbNameClean.startsWith(searchKey);
    });
  };

  const getFilteredDosages = (input) => {
    if (!input) return dosageOptions;
    return dosageOptions.filter(opt => opt.startsWith(input));
  };

  const updateRow = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
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

  const deleteRow = (index) => {
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated.length === 0 ? [{ name: '', dosage: '', duration: '', instruction: 'After Food' }] : updated);
  };

  const handleNameChange = (index, rawInput) => {
    const formatted = rawInput.toUpperCase();
    const updated = [...medicines];
    updated[index].name = formatted;
    if (index === medicines.length - 1 && formatted.trim().length > 0) {
      updated.push({ name: '', dosage: '', duration: '', instruction: 'After Food' });
    }
    setMedicines(updated);
    setActiveSearch({ row: index, field: 'name' }); 
  };

  const handlePreview = () => {
    if (!diagnosis.trim()) { showToast("Please enter a Diagnosis first", "error"); return; }
    const cleanMedicines = medicines.filter(m => m.name.trim() !== '');
    if (cleanMedicines.length === 0) { showToast("Add at least one medicine", "error"); return; }

    const finalMedicines = cleanMedicines.map(m => ({
      ...m,
      duration: m.duration && !isNaN(m.duration) ? `${m.duration} Days` : m.duration
    }));

    const finalDiagnosis = diagnosis.trim().replace(/,\s*$/, '');
    const html = generatePrescriptionHTML(patient, finalMedicines, finalDiagnosis, settings);
    setPreviewContent(html);
    setShowPreview(true);
  };

  const handleSave = async (shouldPrint) => {
    if (!diagnosis.trim()) { showToast("Please enter a Diagnosis first", "error"); return; }
    const cleanMedicines = medicines.filter(m => m.name.trim() !== '');
    if (cleanMedicines.length === 0) { showToast("Add at least one medicine", "error"); return; }

    const finalDiagnosis = diagnosis.trim().replace(/,\s*$/, '');
    const finalMedicines = cleanMedicines.map(m => ({
      ...m,
      duration: m.duration && !isNaN(m.duration) ? `${m.duration} Days` : m.duration
    }));

    const payload = { patientId: patient.id, diagnosis: finalDiagnosis, medicines: finalMedicines };
    const result = await window.api.savePrescription(payload);
    
    if (result.success) {
      if (shouldPrint) {
        const html = previewContent || generatePrescriptionHTML(patient, finalMedicines, finalDiagnosis, settings);
        await window.api.printPrescription(html);
        showToast("Saved & Sent to Printer", "success");
      } else {
        showToast("Prescription Saved Successfully", "success");
      }
      setTimeout(() => onBack(), 1500);
    } else {
      showToast("Error: " + result.error, "error");
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const ActionButtons = () => (
    <>
      <button className="btn btn-secondary hover-effect" onClick={handlePreview}><Eye size={18} /> Preview</button>
      <button className="btn btn-secondary hover-effect" onClick={() => handleSave(false)}><Save size={18} /> Save Only</button>
      <button className="btn btn-primary hover-effect" onClick={() => handleSave(true)}><Printer size={18} /> Save & Print</button>
    </>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {!hideHeader ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={onBack} className="btn btn-secondary back-btn" style={{ padding: '8px' }}><ArrowLeft size={20} /></button>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px' }}>{patient.name}</h2>
              <span style={{ color: '#64748b', fontSize: '14px' }}>{patient.age} Y / {patient.gender} • {patient.phone}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}><ActionButtons /></div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', gap: '10px' }}><ActionButtons /></div>
      )}

      {/* DIAGNOSIS INPUT */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'block' }}>DIAGNOSIS / AILMENT</label>
        <input 
          ref={diagnosisRef} 
          className="form-input" style={{ fontSize: '16px', fontWeight: 500, padding: '12px' }}
          value={diagnosis} onChange={(e) => handleDiagnosisChange(e.target.value)}
          onClick={(e) => { e.stopPropagation(); setShowDiagSuggestions(true); }} autoFocus autoComplete="off"
          placeholder="e.g. Viral Fever, Headache"
        />
        {showDiagSuggestions && filteredTemplates.length > 0 && (
          <ul className="custom-dropdown">
            {filteredTemplates.map((t) => (
              <li key={t.id} onMouseDown={(e) => { e.preventDefault(); applyTemplate(t); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t.diagnosis}</span>
                <span style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: 700 }}><Zap size={12} /> ADD</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="table-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ width: '35%', color: '#64748b', fontSize: '12px', fontWeight: '700', padding: '12px', textTransform: 'uppercase', textAlign: 'left' }}>Medicine Name</th>
              <th style={{ width: '15%', color: '#64748b', fontSize: '12px', fontWeight: '700', padding: '12px', textTransform: 'uppercase', textAlign: 'left' }}>Dosage</th>
              <th style={{ width: '10%', color: '#64748b', fontSize: '12px', fontWeight: '700', padding: '12px', textTransform: 'uppercase', textAlign: 'left' }}>Duration</th>
              <th style={{ width: '35%', color: '#64748b', fontSize: '12px', fontWeight: '700', padding: '12px', textTransform: 'uppercase', textAlign: 'left' }}>Instruction</th>
              <th style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((med, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px', position: 'relative', zIndex: activeSearch.row === index ? 100 : 'auto' }}>
                  <input className="form-input" value={med.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    onClick={(e) => { e.stopPropagation(); setActiveSearch({ row: index, field: 'name' }); }} autoComplete="off"
                  />
                  {activeSearch.row === index && activeSearch.field === 'name' && med.name && (
                    <ul className="custom-dropdown">
                      {getFilteredMedicines(med.name).map((item, i) => (
                        <li key={i} onMouseDown={(e) => { e.preventDefault(); selectMedicine(index, item); }}>{item.name}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td style={{ padding: '8px', position: 'relative', zIndex: activeSearch.row === index ? 100 : 'auto' }}>
                  <input className="form-input" value={med.dosage}
                    onChange={(e) => { updateRow(index, 'dosage', e.target.value); setActiveSearch({ row: index, field: 'dosage' }); }}
                    onClick={(e) => { e.stopPropagation(); setActiveSearch({ row: index, field: 'dosage' }); }} autoComplete="off"
                  />
                   {activeSearch.row === index && activeSearch.field === 'dosage' && (
                    <ul className="custom-dropdown">
                      {getFilteredDosages(med.dosage).map((opt, i) => (
                        <li key={i} onMouseDown={(e) => { e.preventDefault(); updateRow(index, 'dosage', opt); setActiveSearch({ row: null, field: null }); }}>{opt}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td style={{ padding: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input className="form-input" style={{ width: '50px', textAlign: 'center' }} value={med.duration} onChange={(e) => updateRow(index, 'duration', e.target.value)} />
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Days</span>
                  </div>
                </td>
                <td style={{ padding: '8px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                    {instructionOptions.map((opt) => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: med.instruction === opt ? '#0ea5e9' : '#475569', fontWeight: med.instruction === opt ? '700' : '500' }}>
                        <input type="radio" name={`instruction-${index}`} value={opt} checked={med.instruction === opt}
                          onChange={(e) => updateRow(index, 'instruction', e.target.value)} style={{ accentColor: '#0ea5e9', cursor: 'pointer', width: '14px', height: '14px' }}
                        />
                        {opt.replace(" Food", "")} 
                      </label>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  {medicines.length > 1 && <Trash2 size={18} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => deleteRow(index)} />}
                </td>
              </tr>
            ))}
            <tr style={{ height: '150px' }}></tr>
          </tbody>
        </table>
      </div>

      {showPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '850px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, color: '#334155' }}>Prescription Preview ({settings.paperSize})</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={() => handleSave(true)}><Printer size={16} /> Print Now</button>
                <button className="btn btn-secondary" onClick={() => setShowPreview(false)} style={{ padding: '8px' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#525659', padding: '20px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
              <iframe srcDoc={previewContent} title="Preview" style={{ width: settings.paperSize === 'A5' ? '148mm' : '210mm', height: settings.paperSize === 'A5' ? '210mm' : '297mm', backgroundColor: 'white', border: 'none', boxShadow: '0 0 10px rgba(0,0,0,0.5)', transform: settings.paperSize === 'A5' ? 'scale(1.2)' : 'scale(0.85)', transformOrigin: 'top center' }} />
            </div>
          </div>
        </div>
      )}

      {/* IMPROVED TOAST MESSAGES */}
      {toast && (
        <div className={`toast-notification ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          <div className="toast-icon">
            {toast.type === 'success' ? <CheckCircle size={22} color="white" /> : <AlertCircle size={22} color="white" />}
          </div>
          <span>{toast.message}</span>
        </div>
      )}

      <style>{`
        .hover-effect { transition: all 0.2s ease; }
        .hover-effect:hover { transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .form-input { border: 1px solid #949aa4 !important; border-radius: 6px; padding: 8px 10px; transition: all 0.2s; font-size: 14px; }
        .form-input:focus { border-color: #0ea5e9 !important; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1); }
        
        .custom-dropdown { 
          position: absolute; left: 0; right: 0; background: #f0f9ff; 
          border: 1.5px solid #0ea5e9; border-radius: 0 0 6px 6px; padding: 0; margin: 0; 
          z-index: 100; max-height: 200px; overflow-y: auto; list-style: none;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); top: 100%;
        }
        .custom-dropdown li { padding: 10px 12px; font-size: 14px; cursor: pointer; color: #334155; border-bottom: 1px solid #dbeafe; }
        .custom-dropdown li:hover { background-color: #e0f2fe; color: #0ea5e9; }

        /* --- MODERN TOAST NOTIFICATION --- */
        .toast-notification {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 16px 24px;
          border-radius: 12px;
          color: white;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 9999;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          font-weight: 600;
          font-size: 14px;
          min-width: 300px;
        }

        .toast-success { 
          background-color: #10b981; 
          border: 1px solid #059669; 
        }

        .toast-error { 
          background-color: #f43f5e; 
          border: 1px solid #e11d48; 
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Prescription;