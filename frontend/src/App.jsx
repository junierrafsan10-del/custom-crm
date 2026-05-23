import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { get, post } from './utils/api';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Tickets from './pages/Tickets';
import Dialer from './pages/Dialer';
import Leads from './pages/Leads';
import Tasks from './pages/Tasks';
import Members from './pages/Members';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Users from './pages/Users';
import './App.css';

export default function App() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('crm_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('crm_user');
    localStorage.removeItem('crm_token');
    setUser(null);
    navigate('/login');
  };

  // State to track Facebook & WhatsApp connections
  const [metaConnections, setMetaConnections] = useState({
    facebookConnected: false,
    facebookPageName: null,
    facebookPageId: null,
    whatsappConnected: false,
    whatsappBusinessId: null,
    whatsappName: null,
    whatsappPhone: null
  });

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  const fetchConnectionStatus = () => {
    get('/api/auth/status')
      .then(resData => {
        if (resData.success && resData.data) {
          setMetaConnections(resData.data);
        }
      })
      .catch(err => console.error('Failed to fetch status:', err));
  };

  useEffect(() => {
    fetchConnectionStatus();

    // Check if path is redirect callback from Meta OAuth
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (path.startsWith('/auth/callback') && code) {
      setAuthLoading(true);
      navigate('/settings');
      post('/api/auth/meta-callback', { code })
      .then(res => {
        if (!res.ok) throw new Error('Authorization response error');
        return res.json();
      })
      .then(resData => {
        if (resData.success) {
          setMetaConnections(resData.data);
          if (resData.data.facebookConnected) {
            setAuthSuccess(true);
            setTimeout(() => setAuthSuccess(false), 5000);
          } else {
            setAuthError('Connected, but no Facebook Pages were found in your account.');
            setTimeout(() => setAuthError(null), 5000);
          }
        } else {
          setAuthError(resData.error || 'Failed to sync with Meta.');
          setTimeout(() => setAuthError(null), 5000);
        }
        window.history.replaceState({}, document.title, '/');
      })
      .catch(err => {
        console.error(err);
        setAuthError('Connection to Custom CRM servers failed');
        setTimeout(() => setAuthError(null), 5000);
        window.history.replaceState({}, document.title, '/');
      })
      .finally(() => {
        setAuthLoading(false);
      });
    }
  }, []);

  // Handle setting active sidebar CSS property dynamically for Topbar left offset
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width', 
      sidebarOpen ? '16rem' : '5rem'
    );
  }, [sidebarOpen]);

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={(u) => { setUser(u); navigate('/'); }} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          sidebarOpen ? 'pl-64' : 'pl-20'
        }`}
      >
        {/* Topbar Header */}
        <Topbar user={user} metaConnections={metaConnections} />

        {/* Dynamic View Viewport */}
        <main className="flex-1 pt-24 px-6 pb-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat metaConnections={metaConnections} user={user} />} />
            <Route path="/tickets" element={<Tickets user={user} />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/members" element={<Members user={user} setUser={setUser} />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings metaConnections={metaConnections} refreshStatus={fetchConnectionStatus} />} />
            <Route path="/dialer" element={<Dialer />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>

      {/* Meta OAuth handshaking premium loader overlay */}
      {authLoading && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-indigo-500/30 animate-pulse"></div>
          </div>
          <h2 className="text-lg font-bold text-slate-100 tracking-wide animate-pulse">Securing Meta API Handshake...</h2>
          <p className="text-slate-400 text-xs mt-2 max-w-xs leading-relaxed">
            Linking your Facebook Page and WhatsApp Business account to the Custom CRM platform. Please don't close this tab.
          </p>
        </div>
      )}

      {/* Premium Toast notification for Success */}
      {authSuccess && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-emerald-500/30 text-emerald-400 px-4 py-3.5 rounded-xl text-xs font-semibold shadow-2xl shadow-emerald-950/20 flex items-center gap-3 z-50 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          <span>Successfully synchronized Facebook Page & WhatsApp Business API!</span>
        </div>
      )}

      {/* Premium Toast notification for Failure */}
      {authError && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-red-500/30 text-red-400 px-4 py-3.5 rounded-xl text-xs font-semibold shadow-2xl shadow-red-950/20 flex items-center gap-3 z-50 animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <span>Connection Failed: {authError}</span>
        </div>
      )}

    </div>
  );
}

