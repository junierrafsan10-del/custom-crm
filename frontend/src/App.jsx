import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { get, post } from './utils/api';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import BottomNav from './components/BottomNav';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chat = lazy(() => import('./pages/Chat'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Dialer = lazy(() => import('./pages/Dialer'));
const Leads = lazy(() => import('./pages/Leads'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Members = lazy(() => import('./pages/Members'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Users = lazy(() => import('./pages/Users'));

function PageLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-outline-variant/30 border-t-primary animate-spin" />
    </div>
  );
}

function AuthOverlay({ message }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6">
      <div className="animate-scale-in flex flex-col items-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-outline-variant/30 border-t-primary animate-spin" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary/30 animate-ping-slow" />
        </div>
        <h2 className="text-lg font-bold text-on-surface tracking-wide animate-pulse">Securing Meta API Handshake...</h2>
        <p className="text-on-surface-variant text-xs mt-2 max-w-xs leading-relaxed text-center">{message}</p>
      </div>
    </div>
  );
}

function Toast({ type, message }) {
  const isError = type === 'error';
  return (
    <div
      className={`fixed bottom-6 right-6 bg-surface-container border ${isError ? 'border-error/30 text-error' : 'border-primary/30 text-primary'} px-4 py-3.5 rounded-xl text-xs font-semibold shadow-2xl ${isError ? 'shadow-error/10' : 'shadow-primary/10'} flex items-center gap-3 z-50 animate-slide-up`}
    >
      <div className={`w-2 h-2 rounded-full ${isError ? 'bg-error' : 'bg-primary animate-ping'}`} />
      <span>{isError ? `Connection Failed: ${message}` : 'Successfully synchronized Facebook & WhatsApp API!'}</span>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleLogout = () => {
    localStorage.removeItem('crm_user');
    setUser(null);
    navigate('/login');
    post('/api/auth/logout').catch(() => {});
  };

  const [metaConnections, setMetaConnections] = useState({
    facebookConnected: false, facebookPageName: null, facebookPageId: null,
    whatsappConnected: false, whatsappBusinessId: null, whatsappName: null, whatsappPhone: null,
  });

  const [authLoading, setAuthLoading] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return window.location.pathname.startsWith('/auth/callback') && !!params.get('code');
  });
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  const fetchConnectionStatus = () => {
    get('/api/auth/status')
      .then(r => { if (r.success && r.data) setMetaConnections(r.data); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchConnectionStatus();
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (window.location.pathname.startsWith('/auth/callback') && code) {
      navigate('/settings');
      post('/api/auth/meta-callback', { code })
        .then(r => {
          if (r.success) {
            setMetaConnections(r.data);
            if (r.data.facebookConnected) {
              setAuthSuccess(true);
              setTimeout(() => setAuthSuccess(false), 5000);
            } else {
              setAuthError('Connected, but no Facebook Pages were found in your account.');
              setTimeout(() => setAuthError(null), 5000);
            }
          } else {
            setAuthError(r.error || 'Failed to sync with Meta.');
            setTimeout(() => setAuthError(null), 5000);
          }
        })
        .catch(() => {
          setAuthError('Connection to Custom CRM servers failed');
          setTimeout(() => setAuthError(null), 5000);
        })
        .finally(() => {
          window.history.replaceState({}, document.title, '/');
          setAuthLoading(false);
        });
    }
  }, [navigate]);

  if (!user) {
    return (
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={(u) => { setUser(u); navigate('/'); }} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex antialiased bg-grid bg-grid-pattern">
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <Sidebar onLogout={handleLogout} user={user} />
      <BottomNav />

      <main className="flex-1 flex flex-col md:ml-72 min-h-screen relative w-full">
        <Topbar user={user} metaConnections={metaConnections} />

        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-24 md:pb-8 pt-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          <div key={location.pathname} className="animate-fade-in">
            <Suspense fallback={<PageLoading />}>
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
            </Suspense>
          </div>
        </div>
      </main>

      {authLoading && <AuthOverlay message="Linking your Facebook Page and WhatsApp Business account to the Custom CRM platform." />}
      {authSuccess && <Toast type="success" />}
      {authError && <Toast type="error" message={authError} />}
    </div>
  );
}
