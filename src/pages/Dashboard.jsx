import React, { useState, useEffect } from 'react';
import { Users, Activity, Calendar, RefreshCcw } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayCount: 0,
    monthCount: 0,
    weeklyStats: [],
    yearlyStats: []
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('');
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadStats();
    calculateDateRange();
  }, []);

  const loadStats = async () => {
    setIsRefreshing(true);
    const data = await window.api.getDashboardStats();
    if (!data.error) {
      setStats(data);
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const calculateDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    const options = { month: 'short', day: 'numeric' };
    setDateRange(`${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${currentYear}`);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '40px', backgroundColor: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>Dashboard</h2>
        <button 
          onClick={loadStats} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
            backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, color: '#64748b', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <RefreshCcw size={14} className={isRefreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={cardLabelStyle}>Patients Today</p>
              <h1 style={cardValueStyle}>{stats.todayCount}</h1>
            </div>
            <div style={{ backgroundColor: '#e0f2fe', padding: '10px', borderRadius: '10px' }}>
              <Activity size={24} color="#0ea5e9" />
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '10px' }}>Visits recorded today</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={cardLabelStyle}>Patients This Month</p>
              <h1 style={cardValueStyle}>{stats.monthCount}</h1>
            </div>
            <div style={{ backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '10px' }}>
              <Calendar size={24} color="#3b82f6" />
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '10px' }}>Total visits this month</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={cardLabelStyle}>Total Registered</p>
              <h1 style={cardValueStyle}>{stats.totalPatients}</h1>
            </div>
            <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '10px' }}>
              <Users size={24} color="#64748b" />
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '10px' }}>Lifetime patient database</p>
        </div>
      </div>

      {/* Weekly Overview - Passing current day name for highlighting */}
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={sectionTitleStyle}>Weekly Overview</h3>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{dateRange}</span>
        </div>
        <BarChart 
            data={stats.weeklyStats} 
            color="#0ea5e9" 
            highlightLabel={days[new Date().getDay()]} 
        />
      </div>

      {/* Yearly Overview - Passing current month name for highlighting */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={sectionTitleStyle}>Yearly Overview</h3>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{currentYear}</span>
        </div>
        <BarChart 
            data={stats.yearlyStats} 
            color="#8b5cf6" 
            highlightLabel={months[new Date().getMonth()]}
        />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
};

const BarChart = ({ data, color, highlightLabel }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.count), 1); 

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '250px', paddingTop: '30px', paddingBottom: '10px' }}>
      {data.map((item, i) => {
        const heightPercent = (item.count / maxVal) * 100;
        const isCurrent = item.label === highlightLabel;

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
              <div 
                className={`bar ${isCurrent ? 'current-bar' : ''}`} 
                style={{ 
                    '--bar-color': item.count > 0 ? (isCurrent ? color : color + '99') : '#f1f5f9', 
                    height: `${heightPercent}%`,
                    // Add a shadow glow if it's the current bar
                    boxShadow: isCurrent ? `0 0 15px ${color}44` : 'none',
                    border: isCurrent ? `1.5px solid ${color}` : 'none',
                    borderBottom: 'none'
                }}
              >
                <div className="bar-label" style={{ color: isCurrent ? color : '#334155', fontWeight: isCurrent ? 800 : 700 }}>
                    {item.count}
                </div>
              </div>
            </div>
            <div style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: isCurrent ? color : '#64748b', 
                fontWeight: isCurrent ? 800 : 600,
                backgroundColor: isCurrent ? `${color}15` : 'transparent',
                padding: isCurrent ? '2px 8px' : '0',
                borderRadius: '4px'
            }}>
                {item.label}
            </div>
          </div>
        );
      })}
      <style>{`
        .bar { width: 60%; background-color: var(--bar-color); border-radius: 6px 6px 0 0; transition: all 0.3s ease; position: relative; min-height: 4px; }
        .bar-label { position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 13px; opacity: 0; }
        .bar:not([style*="height: 0%"]) .bar-label { opacity: 1; }
        .current-bar { width: 65% !important; z-index: 2; }
      `}</style>
    </div>
  );
};

const cardStyle = { backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const cardLabelStyle = { margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 600 };
const cardValueStyle = { margin: '5px 0 0 0', fontSize: '32px', color: '#0f172a', fontWeight: 800 };
const sectionTitleStyle = { margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: 700 };

export default Dashboard;