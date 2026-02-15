import React, { useState } from 'react';
import { ArrowLeft, FilePlus, History, Award } from 'lucide-react';
import Prescription from './Prescription.jsx';
import PatientHistory from './PatientHistory.jsx';
import Certificate from './Certificate.jsx';
import { getLiveAge } from '../utils/ageHelper';

const PatientView = ({ patient, onBack }) => {
  const [activeTab, setActiveTab] = useState('new-rx');
  const [draftRx, setDraftRx] = useState(null);

  const handleAddToRx = (data) => {
    setDraftRx(data);
    setActiveTab('new-rx');
  };

  return (
    <div className="view-container">
      
      {/* HEADER */}
      <div className="view-header">
        <div className="header-left">
          <button onClick={onBack} className="btn-back">
            <ArrowLeft size={20} />
          </button>
          <div className="patient-info">
            <h2 className="patient-name">{patient.name}</h2>
            <div className="patient-meta">
              <span>{getLiveAge(patient)} Y</span>
              <span className="dot">•</span>
              <span>{patient.gender}</span>
              <span className="dot">•</span>
              <span>{patient.phone}</span>
            </div>
          </div>
        </div>

        {/* MODERN TABS */}
        <div className="tabs-container">
          <TabButton 
            active={activeTab === 'new-rx'} 
            onClick={() => setActiveTab('new-rx')} 
            icon={<FilePlus size={16} />} 
            label="Prescription" 
          />
          <TabButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={<History size={16} />} 
            label="History" 
          />
          <TabButton 
            active={activeTab === 'cert'} 
            onClick={() => setActiveTab('cert')} 
            icon={<Award size={16} />} 
            label="Certificate" 
          />
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="view-content">
        {activeTab === 'new-rx' && (
          <Prescription 
            patient={patient} 
            onBack={onBack} 
            hideHeader={true} 
            initialData={draftRx}
            onDataLoaded={() => setDraftRx(null)}
          />
        )}
        
        {activeTab === 'history' && (
          <PatientHistory 
            patient={patient} 
            onAddToRx={handleAddToRx}
            onBack={onBack}
          />
        )}

        {activeTab === 'cert' && (
          <Certificate 
            patient={patient} 
            onBack={onBack} 
          />
        )}
      </div>

      <style>{`
        .view-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          background-color: #f8fafc;
        }

        /* HEADER STYLES */
        .view-header {
          background-color: white;
          padding: 16px 24px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          z-index: 10;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-back {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-back:hover {
          background: #f1f5f9;
          color: #1e293b;
          border-color: #cbd5e1;
        }

        .patient-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .patient-name {
          margin: 0;
          font-size: 20px;
          color: #1e293b;
          font-weight: 700;
          line-height: 1.2;
        }

        .patient-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }

        .dot {
          color: #cbd5e1;
          font-weight: 700;
        }

        /* TABS STYLES */
        .tabs-container {
          display: flex;
          gap: 4px;
          background-color: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: #64748b;
          background: transparent;
        }

        .tab-btn:hover:not(.active) {
          color: #334155;
          background: rgba(0,0,0,0.03);
        }

        .tab-btn.active {
          background: white;
          color: #0ea5e9; /* Sky Blue Accent */
          box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06);
        }

        .tab-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }

        /* CONTENT AREA */
        .view-content {
          flex: 1;
          padding: 20px;
          overflow: hidden;
          position: relative;
        }
      `}</style>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`tab-btn ${active ? 'active' : ''}`}
  >
    {icon} 
    <span>{label}</span>
  </button>
);

export default PatientView;