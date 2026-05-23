import React, { useState } from 'react';
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
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    setLoading(true);

    post('/api/users/login', { username, password })
      .then((data) => {
        if (data.success && data.user) {
          localStorage.setItem('crm_user', JSON.stringify(data.user));
          if (data.token) localStorage.setItem('crm_token', data.token);
          onLoginSuccess(data.user);
        } else {
          setError('Authentication failed. Please try again.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Server connection failed. Is the backend running?');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleQuickFill = (userType) => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('agent');
      setPassword('agent123');
    }
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070b13] flex items-center justify-center overflow-y-auto px-4 py-8 font-sans select-none">
      
      {/* Background ambient glowing radial effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] flex flex-col gap-6 z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <span className="font-bold text-white text-2xl tracking-wider">C</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Custom CRM System
            </h1>
            <p className="text-xs text-slate-500 mt-1">Provide credentials to access customer operations</p>
          </div>
        </div>

        {/* Login Glass Card */}
        <div className="glass-panel rounded-2xl border border-slate-800/80 p-8 shadow-2xl shadow-slate-950/50 relative overflow-hidden">
          
          {/* Subtle upper glow line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Display error alert */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-2 animate-shake">
                <ShieldAlert size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center text-slate-500 pointer-events-none">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-850 focus:border-indigo-500/70 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center text-slate-500 pointer-events-none">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-850 focus:border-indigo-500/70 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-650/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  <span>Secure Login</span>
                </>
              )}
            </button>

          </form>

          {/* Quick Demoselect access section */}
          <div className="mt-6 pt-5 border-t border-slate-850 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Sparkles size={13} className="text-indigo-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Simulation Account Presets</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="py-1.5 px-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-indigo-500/30 text-[11px] font-medium rounded-lg text-indigo-400 transition-all flex flex-col items-center justify-center"
              >
                <span>Admin User</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5">admin / admin123</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleQuickFill('agent')}
                className="py-1.5 px-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-emerald-500/30 text-[11px] font-medium rounded-lg text-emerald-400 transition-all flex flex-col items-center justify-center"
              >
                <span>Agent User</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5">agent / agent123</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer text */}
        <p className="text-center text-[10px] text-slate-600">
          Custom CRM &copy; {new Date().getFullYear()} - Handshaking Meta APIs
        </p>

      </div>
    </div>
  );
}
