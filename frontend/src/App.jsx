import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { get, post } from './utils/api';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import BottomNav from './components/BottomNav';
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
  const location = useLocation();
  
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('crm_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('crm_user');
    setUser(null);
    navigate('/login');
  };

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

    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (path.startsWith('/auth/callback') && code) {
      setAuthLoading(true);
      navigate('/settings');
      post('/api/auth/meta-callback', { code })
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

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={(u) => { setUser(u); navigate('/'); }} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex antialiased bg-grid-pattern bg-grid">
      
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[100px]"></div>
      </div>

      <Sidebar onLogout={handleLogout} user={user} />
      <BottomNav />

      <main className="flex-1 flex flex-col md:ml-72 min-h-screen relative w-full">
        <Topbar user={user} metaConnections={metaConnections} />

        <div className="flex-1 p-8 pb-20 md:pb-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <Routes location={location}>
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
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {authLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-outline-variant/30 border-t-primary animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary/30 animate-pulse"></div>
            </div>
            <h2 className="text-lg font-bold text-on-surface tracking-wide animate-pulse">Securing Meta API Handshake...</h2>
            <p className="text-on-surface-variant text-xs mt-2 max-w-xs leading-relaxed">
              Linking your Facebook Page and WhatsApp Business account to the Custom CRM platform.
            </p>
          </motion.div>
        </div>
      )}

      {authSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-surface-container border border-primary/30 text-primary px-4 py-3.5 rounded-xl text-xs font-semibold shadow-2xl shadow-primary/10 flex items-center gap-3 z-50"
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <span>Successfully synchronized Facebook & WhatsApp API!</span>
        </motion.div>
      )}

      {authError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-surface-container border border-error/30 text-error px-4 py-3.5 rounded-xl text-xs font-semibold shadow-2xl shadow-error/10 flex items-center gap-3 z-50"
        >
          <div className="w-2 h-2 rounded-full bg-error" />
          <span>Connection Failed: {authError}</span>
        </motion.div>
      )}
    </div>
  );
}
