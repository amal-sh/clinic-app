import React, { useState } from 'react';
import { LayoutDashboard, Users, Pill, FileText, Settings as SettingsIcon, Stethoscope } from 'lucide-react';
import './index.css';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import PatientView from './pages/PatientView.jsx';
import Settings from './pages/Settings.jsx';
import Medicines from './pages/Medicines.jsx';
import Templates from './pages/Templates.jsx';

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const navigateTo = (view, data = null) => {
    setCurrentView(view);
    setSelectedPatient(data);
  };

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        
        {/* --- UPDATED HEADER --- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingLeft: '10px' }}>
          <Stethoscope color="white" size={26} />
          <h2 style={{ margin: 0, fontSize: '22px', color: 'white', fontWeight: 700 }}>Clinic App</h2>
        </div>

        <NavButton 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          active={currentView === 'dashboard'} 
          onClick={() => navigateTo('dashboard')}
        />
        <NavButton 
          icon={<Users size={20} />} 
          label="Patients" 
          active={currentView === 'patients' || currentView === 'prescription'} 
          onClick={() => navigateTo('patients')}
        />
        <NavButton 
          icon={<Pill size={20} />} 
          label="Medicines" 
          active={currentView === 'medicines'} 
          onClick={() => navigateTo('medicines')}
        />
        
        <NavButton 
          icon={<FileText size={20} />} 
          label="Templates" 
          active={currentView === 'templates'} 
          onClick={() => navigateTo('templates')}
        />
        
        <div style={{ flex: 1 }}></div>
        
        <NavButton 
          icon={<SettingsIcon size={20} />} 
          label="Settings" 
          active={currentView === 'settings'} 
          onClick={() => navigateTo('settings')}
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="main-content">
        
        {currentView === 'dashboard' && (
          <Dashboard onNavigate={navigateTo} />
        )}
        
        {currentView === 'patients' && (
          <Patients 
            onPatientSelect={(patient) => navigateTo('prescription', patient)} 
          />
        )}
        
        {currentView === 'prescription' && (
          <PatientView 
            patient={selectedPatient} 
            onBack={() => navigateTo('patients')} 
          />
        )}

        {currentView === 'medicines' && <Medicines />}
        
        {currentView === 'templates' && <Templates />}

        {currentView === 'settings' && <Settings />}
      </div>
    </div>
  );
};

// Reusable Nav Button
const NavButton = ({ icon, label, active, onClick }) => (
  <div className={`nav-btn ${active ? 'active' : ''}`} onClick={onClick}>
    {icon}
    <span style={{ fontSize: '15px', fontWeight: 500 }}>{label}</span>
  </div>
);

export default App;