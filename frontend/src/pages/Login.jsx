import { useState } from 'react';
import { post } from '../utils/api';
import { User, Lock, Eye, EyeOff, LogIn, ShieldAlert, Sparkles } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Please enter both username and password.'); return; }
    setError('');
    setLoading(true);
    post('/api/users/login', { username, password })
      .then((data) => {
        if (data.success && data.user) {
          localStorage.setItem('crm_user', JSON.stringify(data.user));
          onLoginSuccess(data.user);
        } else {
          setError('Authentication failed. Please try again.');
        }
      })
      .catch((err) => { setError(err.message || 'Server connection failed.'); })
      .finally(() => setLoading(false));
  };

  const handleQuickFill = (type) => {
    setUsername(type === 'admin' ? 'admin' : 'agent');
    setPassword(type === 'admin' ? 'admin123' : 'agent123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-y-auto px-4 py-8 select-none">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-primary/8 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[400px] flex flex-col gap-6 z-10 animate-fade-in">
        {/* Brand */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/10">
            <span className="text-primary text-xl font-bold">C</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-on-surface">Custom CRM</h1>
            <p className="text-xs text-on-surface-variant/70 mt-1">Sign in to your account</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl border border-outline-variant/15 p-7 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-4.5">
            {error && (
              <div className="p-3 bg-error/10 border border-error/20 text-error rounded-lg text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <ShieldAlert size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none" />
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username" className="input-field pl-9" required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Enter password"
                  className="input-field pl-9 pr-9" required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 mt-1 bg-primary text-on-primary hover:bg-primary-fixed disabled:opacity-50 text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary/15 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn size={15} /><span>Sign In</span></>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-outline-variant/15">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles size={12} className="text-on-surface-variant/50" />
              <span className="text-[10px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">Quick Access</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => handleQuickFill('admin')}
                className="py-2 px-3 bg-surface-container-low/60 hover:bg-surface-container-low border border-outline-variant/15 hover:border-primary/25 text-[11px] font-medium rounded-lg text-on-surface-variant hover:text-primary transition-all"
              >
                <span className="block">Admin</span>
                <span className="block text-[9px] text-on-surface-variant/40 font-mono mt-0.5">admin / admin123</span>
              </button>
              <button type="button" onClick={() => handleQuickFill('agent')}
                className="py-2 px-3 bg-surface-container-low/60 hover:bg-surface-container-low border border-outline-variant/15 hover:border-primary/25 text-[11px] font-medium rounded-lg text-on-surface-variant hover:text-primary transition-all"
              >
                <span className="block">Agent</span>
                <span className="block text-[9px] text-on-surface-variant/40 font-mono mt-0.5">agent / agent123</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-on-surface-variant/30 font-medium">
          Custom CRM &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
