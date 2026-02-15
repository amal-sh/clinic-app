import React, { useState, useEffect, useRef } from 'react';
import { Printer, Save, Eye, FileText, X, CheckCircle, MapPin, Zap } from 'lucide-react';
import { generateCertificateHTML } from '../utils/certificateTemplate';

const Certificate = ({ patient, onBack }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [residencyWork, setResidencyWork] = useState('');
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({});
  const [allTemplates, setAllTemplates] = useState([]);
  const [showDiagSuggestions, setShowDiagSuggestions] = useState(false);

  const diagnosisRef = useRef(null);

  // Date Logic
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(tomorrowStr);
  const [issueDate, setIssueDate] = useState(todayStr);

  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    loadData();
    const handleClickOutside = () => setShowDiagSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadData = async () => {
    const sett = await window.api.getSettings();
    setSettings(sett);
    const temps = await window.api.getTemplates();
    setAllTemplates(temps);
  };

  const toTitleCase = (str) => str.replace(/\b\w/g, char => char.toUpperCase());

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
    setShowDiagSuggestions(false);
    if (diagnosisRef.current) diagnosisRef.current.focus();
  };

  const handlePreview = () => {
    if (!validate()) return;
    const html = generateCertificateHTML(patient, diagnosis.trim().replace(/,\s*$/, ''), startDate, endDate, issueDate, residencyWork, settings);
    setPreviewContent(html);
    setShowPreview(true);
  };

  const handleSave = async (shouldPrint) => {
    if (!validate()) return;
    const cleanDiagnosis = diagnosis.trim().replace(/,\s*$/, '');
    const payload = { patientId: patient.id, diagnosis: cleanDiagnosis, startDate, endDate, residencyWork };
    const result = await window.api.saveCertificate(payload);

    if (result.success) {
      if (shouldPrint) {
        const html = previewContent || generateCertificateHTML(patient, cleanDiagnosis, startDate, endDate, issueDate, residencyWork, settings);
        await window.api.printPrescription(html);
        showToast("✅ Saved & Sent to Printer", "success");
      } else {
        showToast("✅ Certificate Saved", "success");
      }
      setTimeout(() => onBack(), 1500);
    } else {
      showToast("❌ Error: " + result.error, "error");
    }
  };

  const validate = () => {
    if (!diagnosis.trim()) { showToast("⚠️ Please enter a Diagnosis first", "error"); return false; }
    if (!startDate || !endDate || !issueDate) { showToast("⚠️ Please select all dates", "error"); return false; }
    if (new Date(startDate) > new Date(endDate)) { showToast("⚠️ End Date cannot be before Start Date", "error"); return false; }
    return true;
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px' }}>
        <button className="btn btn-secondary hover-effect" onClick={handlePreview}><Eye size={18} /> Preview</button>
        <button className="btn btn-secondary hover-effect" onClick={() => handleSave(false)}><Save size={18} /> Save Only</button>
        <button className="btn btn-primary hover-effect" onClick={() => handleSave(true)}><Printer size={18} /> Save & Print</button>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ 
          backgroundColor: 'white', padding: '30px 40px', borderRadius: '12px', 
          border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          maxWidth: '650px', width: '100%', height: 'fit-content'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '25px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
            <FileText size={24} color="#0ea5e9" />
            Medical Certificate Details
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Residency / Workplace (Optional)</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <input className="form-input" placeholder="e.g. Perinjanam, Thrissur" value={residencyWork} onChange={(e) => setResidencyWork(toTitleCase(e.target.value))} style={{ width: '100%', paddingLeft: '38px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Diagnosis / Reason</label>
              <input ref={diagnosisRef} className="form-input" placeholder="e.g. Viral Fever" value={diagnosis} onChange={(e) => handleDiagnosisChange(e.target.value)} onClick={(e) => { e.stopPropagation(); setShowDiagSuggestions(true); }} style={{ width: '100%' }} autoComplete="off" />
              {showDiagSuggestions && filteredTemplates.length > 0 && (
                <ul className="custom-dropdown">
                  {filteredTemplates.map((t) => (
                    <li key={t.id} onMouseDown={(e) => { e.preventDefault(); applyTemplate(t); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{t.diagnosis}</span>
                      <span style={{ fontSize: '10px', color: '#0ea5e9', fontWeight: 700 }}><Zap size={12} /> ADD</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Date of Issue</label>
              <input type="date" className="form-input" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Rest From</label>
              <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Rest To</label>
              <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '850px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, color: '#334155' }}>Certificate Preview ({settings.paperSize})</h3>
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

      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1000 }}>
          {toast.type === 'success' && <CheckCircle size={20} />}
          <span style={{ fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}

      <style>{`
        .hover-effect { transition: all 0.2s ease; }
        .hover-effect:hover { transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .form-input { border: 1px solid #a4a8ae !important; border-radius: 6px; padding: 10px 12px; transition: all 0.2s; outline: none; font-size: 15px; }
        .form-input:focus { border-color: #0ea5e9 !important; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1); }
        .custom-dropdown { position: absolute; left: 0; right: 0; background: #f0f9ff; border: 1.5px solid #0ea5e9; border-radius: 6px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); list-style: none; padding: 0; margin: 0; z-index: 100; max-height: 180px; overflow-y: auto; }
        .custom-dropdown li { padding: 10px 12px; font-size: 14px; cursor: pointer; color: #334155; border-bottom: 1px solid #dbeafe; }
        .custom-dropdown li:hover { background-color: #e0f2fe; color: #0ea5e9; }
      `}</style>
    </div>
  );
};

export default Certificate;