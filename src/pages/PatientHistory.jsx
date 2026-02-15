import React, { useState, useEffect } from 'react';
import { 
  Calendar, ChevronDown, ChevronUp, Pill, FileText, Clock, 
  FilePlus, Copy, MoreVertical, Printer, FolderOpen, CheckCircle, AlertCircle 
} from 'lucide-react';
import { generatePrescriptionHTML } from '../utils/printTemplate';
import { generateCertificateHTML } from '../utils/certificateTemplate';

const PatientHistory = ({ patient, onAddToRx, onBack }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [expandedKey, setExpandedKey] = useState(null); 
  const [detailsCache, setDetailsCache] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  
  const [toast, setToast] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  useEffect(() => {
    loadSettings();
    loadHistory();
    
    const handleGlobalClick = () => setMenuOpenId(null);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [patient]);

  const loadSettings = async () => {
    const data = await window.api.getSettings();
    setSettings(data);
  };

  const loadHistory = async () => {
    const data = await window.api.getPatientHistory(patient.id);
    setHistory(data);
    setLoading(false);

    if (data.length > 0) {
      const firstVisit = data[0];
      const uniqueKey = `${firstVisit.type}-${firstVisit.id}`;
      setExpandedKey(uniqueKey);
      if (firstVisit.type === 'RX') fetchDetails(firstVisit.id);
    }
  };

  const fetchDetails = async (visitId) => {
    if (!detailsCache[visitId]) {
      const meds = await window.api.getPrescriptionDetails(visitId);
      setDetailsCache(prev => ({ ...prev, [visitId]: meds }));
      return meds;
    }
    return detailsCache[visitId];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
  };

  const toggleRow = (visit) => {
    const key = `${visit.type}-${visit.id}`;
    if (expandedKey === key) {
      setExpandedKey(null);
    } else {
      setExpandedKey(key);
      if (visit.type === 'RX') fetchDetails(visit.id);
    }
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToRxAction = async (e, visit) => {
    e.stopPropagation();
    const meds = detailsCache[visit.id] || await fetchDetails(visit.id);
    const formattedMeds = meds.map(m => ({
      name: m.medicine, dosage: m.dosage, duration: m.duration, instruction: m.instruction
    }));
    onAddToRx({ diagnosis: visit.diagnosis, medicines: formattedMeds });
  };

  const handlePrintAsNew = async (e, visit) => {
    e.stopPropagation();
    setActionLoading(visit.id);
    try {
      const meds = detailsCache[visit.id] || await fetchDetails(visit.id);
      const formattedMeds = meds.map(m => ({
        name: m.medicine, dosage: m.dosage, duration: m.duration, instruction: m.instruction
      }));
      const payload = { patientId: patient.id, diagnosis: visit.diagnosis, medicines: formattedMeds };
      const result = await window.api.savePrescription(payload);
      
      if (result.success) {
        const html = generatePrescriptionHTML(patient, formattedMeds, visit.diagnosis, settings);
        await window.api.printPrescription(html);
        
        showToast("Saved & Printed Successfully", "success");
        
        setTimeout(() => {
          if (onBack) onBack();
        }, 1500);
      } else {
        showToast("Error saving prescription", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("System Error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReprint = async (e, visit) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (visit.type === 'RX') {
      let meds = detailsCache[visit.id] || await window.api.getPrescriptionDetails(visit.id);
      const formatted = meds.map(m => ({ ...m, name: m.medicine }));
      const html = generatePrescriptionHTML(patient, formatted, visit.diagnosis, settings);
      await window.api.printPrescription(html);
    } else {
      const html = generateCertificateHTML(patient, visit.diagnosis, visit.start_date, visit.end_date, settings);
      await window.api.printPrescription(html);
    }
  };

  if (loading) return <div style={{ padding: '20px', color: '#64748b' }}>Loading history...</div>;

  if (!loading && history.length === 0) {
    return (
      <div className="history-container empty">
        <div className="empty-state">
          <div className="empty-icon-bg">
            <FolderOpen size={32} strokeWidth={1.5} />
          </div>
          <h3>No Medical History Found</h3>
          <p>This patient has no previous prescriptions or certificates.</p>
        </div>
        <style>{`
          .history-container {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f8fafc;
          }
          .empty-state {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            color: #64748b;
          }
          .empty-icon-bg {
            width: 64px;
            height: 64px;
            background-color: #f1f5f9;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            margin-bottom: 4px;
          }
          .empty-state h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #334155;
          }
          .empty-state p {
            margin: 0;
            font-size: 13px;
            max-width: 250px;
            line-height: 1.5;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="history-container">
      {history.map((visit) => {
        const uniqueKey = `${visit.type}-${visit.id}`;
        const isExpanded = expandedKey === uniqueKey;
        const medicines = detailsCache[visit.id] || [];
        const isCert = visit.type === 'CERT';

        return (
          <div 
            key={uniqueKey} 
            className={`visit-card ${isExpanded ? 'active' : ''} ${isCert ? 'cert-border' : 'rx-border'}`}
            onClick={() => toggleRow(visit)}
          >
            {/* CARD HEADER */}
            <div className="card-header">
              
              <div className="header-info">
                <h3 className="card-title">{visit.diagnosis || 'General Checkup'}</h3>
                <div className="badge-row">
                   <div className={`type-badge ${isCert ? 'cert' : 'rx'}`}>
                    {isCert ? <FileText size={10} /> : <Pill size={10} />}
                    <span>{isCert ? 'CERTIFICATE' : 'PRESCRIPTION'}</span>
                  </div>
                  <div className="date-badge">
                    <Calendar size={12} strokeWidth={2.5} />
                    <span>{formatDate(visit.date)}</span>
                  </div>
                </div>
              </div>

              <div className="header-actions">
                {!isCert && (
                  <>
                    <button 
                      className="btn-action edit" 
                      onClick={(e) => handleAddToRxAction(e, visit)}
                      title="Edit in New Prescription"
                    >
                      <FilePlus size={14} /> <span>Add to Rx</span>
                    </button>
                    
                    <button 
                      className="btn-action save" 
                      onClick={(e) => handlePrintAsNew(e, visit)}
                      disabled={actionLoading === visit.id}
                      title="Save as New & Print"
                    >
                      {actionLoading === visit.id ? (
                        <span className="spinner-small">...</span>
                      ) : (
                        <Copy size={14} />
                      )}
                      <span>Print New</span>
                    </button>
                  </>
                )}

                <div className="menu-container">
                   <button 
                    className={`menu-btn ${menuOpenId === visit.id ? 'active' : ''}`} 
                    onClick={(e) => toggleMenu(e, visit.id)}
                   >
                     <MoreVertical size={16} />
                   </button>
                   
                   {menuOpenId === visit.id && (
                     <div className="menu-dropdown">
                       <button onClick={(e) => handleReprint(e, visit)}>
                         <Printer size={14} /> Reprint Original
                       </button>
                     </div>
                   )}
                </div>

                <div className="chevron-icon">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>

            {/* EXPANDED CONTENT */}
            {isExpanded && (
              <div className="card-content">
                {!isCert ? (
                  <div className="medicine-table">
                    <div className="med-thead">
                      <span>Medicine Name</span>
                      <span>Dosage</span>
                      <span>Duration</span>
                      <span>Instruction</span>
                    </div>
                    {medicines.length > 0 ? (
                      medicines.map((med, idx) => (
                        <div key={idx} className="med-trow">
                          <span className="col-name">{med.medicine}</span>
                          <span className="col-dosage">{med.dosage}</span>
                          <span className="col-duration">{med.duration}</span>
                          <span className="col-instruction">{med.instruction}</span>
                        </div>
                      ))
                    ) : (
                      <div className="loading-meds">Fetching medicines...</div>
                    )}
                  </div>
                ) : (
                  <div className="cert-content-box">
                    <div className="cert-pill">
                      <Clock size={16} />
                      <span>Rest Period: <strong>{formatDate(visit.start_date)}</strong> to <strong>{formatDate(visit.end_date)}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* MODERN TOAST MESSAGES (Matching Prescription.jsx) */}
      {toast && (
        <div className={`toast-notification ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          <div className="toast-icon">
            {toast.type === 'success' ? <CheckCircle size={22} color="white" /> : <AlertCircle size={22} color="white" />}
          </div>
          <span>{toast.message}</span>
        </div>
      )}

      <style>{`
        .history-container {
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
          overflow-y: auto;
          background-color: #f8fafc;
        }

        /* --- CARD STYLE --- */
        .visit-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: visible;
        }

        .rx-border:hover {
          border-color: #0ea5e9; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }

        .rx-border.active {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border-color: #0ea5e9;
        }
        .cert-border:hover {
          border-color: #f59e0b; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }
        .cert-border.active {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border-color: #f59e0b;
        }

        .rx-border { border-left: 4px solid #0ea5e9; }
        .cert-border { border-left: 4px solid #f59e0b; }

        /* --- HEADER LAYOUT --- */
        .card-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-info { display: flex; flex-direction: column; gap: 8px; }

        .card-title { 
          margin: 0; 
          font-size: 18px; 
          color: #1e293b; 
          font-weight: 700; 
        }

        .badge-row { display: flex; gap: 8px; align-items: center; }

        .date-badge {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; 
          font-weight: 700; 
          color: #0f172a; 
          background: #e2e8f0; 
          padding: 3px 10px; 
          border-radius: 6px;
          border: 1px solid #cbd5e1;
        }

        .type-badge {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 800;
          padding: 3px 8px; border-radius: 4px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .type-badge.rx { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; }
        .type-badge.cert { background: #fffbeb; color: #92400e; border: 1px solid #fef3c7; }

        /* --- ACTIONS --- */
        .header-actions { display: flex; align-items: center; gap: 10px; }

        .btn-action {
          display: flex; align-items: center; gap: 6px; 
          padding: 6px 12px; border-radius: 8px; 
          font-size: 13px; font-weight: 600; 
          cursor: pointer; transition: all 0.2s; 
          border: 1px solid;
          background: #f8fafc;
        }
        
        .btn-action.edit { color: #2563eb; border-color: #93c5fd; }
        .btn-action.edit:hover { background: #3b82f6; color: white; border-color: #3b82f6; }

        .btn-action.save { color: #16a34a; border-color: #86efac; }
        .btn-action.save:hover { background: #16a34a; color: white; border-color: #16a34a; }

        .chevron-icon { color: #94a3b8; margin-left: 5px; }

        /* --- 3-DOT MENU --- */
        .menu-container { position: relative; }
        .menu-btn {
          background: transparent; border: 1px solid transparent; padding: 6px;
          border-radius: 6px; color: #94a3b8; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: 0.2s;
        }
        .menu-btn:hover, .menu-btn.active { 
          background: #f1f5f9; color: #334155; border-color: #cbd5e1; 
        }

        .menu-dropdown {
          position: absolute; right: 0; top: 120%;
          background: white; border: 1px solid #e2e8f0;
          border-radius: 8px; padding: 4px; width: 140px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 50;
        }
        .menu-dropdown button {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 8px 12px;
          border: none; background: transparent;
          color: #475569; font-size: 13px; font-weight: 500;
          cursor: pointer; text-align: left; border-radius: 4px;
        }
        .menu-dropdown button:hover { background: #f8fafc; color: #1e293b; }

        /* --- MEDICINE TABLE --- */
        .card-content {
          padding: 0 20px 20px 20px;
          height: auto; 
          border-top: 1px solid #f1f5f9;
        }

        .medicine-table {
          margin-top: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          overflow: hidden;
        }

        .med-thead {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 2fr;
          padding: 10px 15px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }

        .med-trow {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 2fr;
          padding: 12px 15px;
          font-size: 13px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          align-items: center;
          transition: background-color 0.1s ease;
        }
        .med-trow:hover {
          background-color: #f8fafc; 
        }
        .med-trow:last-child { border-bottom: none; }

        .col-name { font-weight: 700; color: #1e293b; }
        .col-dosage { font-weight: 600; color: #475569; }
        .col-duration { color: #334155; font-weight: 700; }
        .col-instruction { color: #475569; font-weight: 500; }

        .cert-content-box { padding-top: 15px; }
        .cert-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          background: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 8px;
          color: #92400e;
          font-size: 14px;
        }

        .loading-meds { padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }

        /* --- TOAST STYLES --- */
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

export default PatientHistory;