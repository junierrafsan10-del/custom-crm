import React, { useState, useEffect } from 'react';
import { get, post, put, del } from '../utils/api';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Trash2, 
  Edit2, 
  Lock, 
  X, 
  Check, 
  Copy, 
  Key, 
  User, 
  Globe, 
  Loader2,
  AlertCircle
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop', // Female
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop', // Male
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop', // Female Executive
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop', // Male Professional
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop', // Female Professional
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop'  // Male Professional 2
];

export default function Members({ user, setUser }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clipboard copies
  const [copiedId, setCopiedId] = useState(null);

  // Modal control
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'Agent',
    email: '',
    phone: '',
    avatar: AVATAR_PRESETS[0]
  });

  const isAdmin = user?.role === 'Admin';

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get('/api/users');
      if (data.success) {
        setMembers(data.users);
      } else {
        throw new Error(data.error || 'Failed to fetch members.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCopy = (text, typeId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(typeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'Agent',
      email: '',
      phone: '',
      avatar: AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)]
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name || '',
      username: member.username || '',
      password: '', // Leave blank to keep existing
      role: member.role || 'Agent',
      email: member.email || '',
      phone: member.phone || '',
      avatar: member.avatar || AVATAR_PRESETS[0]
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) {
      setFormError('Name, username and password are required.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const data = await post('/api/users/create', formData);
      if (data.success) {
        setShowAddModal(false);
        fetchMembers();
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username) {
      setFormError('Name and username are required.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    const payload = {
      id: selectedMember.id || selectedMember._id,
      ...formData
    };

    // If password field is empty, don't send/change password
    if (!formData.password) {
      delete payload.password;
    }

    try {
      const memberId = selectedMember.id || selectedMember._id;
      const { id, ...bodyPayload } = payload;
      const data = await put('/api/users/' + memberId, bodyPayload);
      if (data.success) {
        setShowEditModal(false);
        fetchMembers();

        const currentUserId = user.id || user._id;
        const updatedUserId = data.user?.id || data.user?._id;
        if (currentUserId === updatedUserId && data.user) {
          const updatedSessionUser = {
            ...user,
            ...data.user,
            id: updatedUserId,
            _id: updatedUserId
          };
          localStorage.setItem('crm_user', JSON.stringify(updatedSessionUser));
          setUser(updatedSessionUser);
        }
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this team member? This action is irreversible.')) {
      return;
    }

    try {
      const data = await del('/api/users/' + memberId);
      if (data.success) {
        fetchMembers();

        const currentUserId = user.id || user._id;
        if (currentUserId === memberId) {
          localStorage.removeItem('crm_user');
          setUser(null);
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Team Members</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Manage and organize custom CRM credentials & roles</p>
          </div>
        </div>

        {isAdmin && (
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <UserPlus size={14} /> Add Member
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
          <p className="text-xs text-slate-500">Retrieving credentials database...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <div>
            <h4 className="text-xs font-bold">Failed to sync database</h4>
            <p className="text-[11px] text-red-400/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Team Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => {
            const memberId = member.id || member._id;
            const isSelf = (user.id || user._id) === memberId;

            return (
              <div 
                key={memberId} 
                className="p-6 rounded-2xl bg-slate-900/30 backdrop-blur-md border border-slate-800/80 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-300 relative group shadow-lg hover:shadow-xl"
              >
                {/* Upper card layout */}
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-14 h-14 rounded-2xl object-crop border border-slate-800 bg-slate-950"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-purple-650/20 border border-slate-850 flex items-center justify-center font-bold text-lg text-indigo-400">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wide uppercase ${
                        member.role === 'Admin' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {member.role}
                      </span>
                      {isSelf && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-extrabold tracking-wider uppercase">
                          You
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    {member.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">@{member.username}</p>
                  
                  <div className="mt-5 space-y-2.5 text-xs text-slate-400">
                    <div className="flex items-center justify-between py-1 border-b border-slate-850/50">
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-slate-500" />
                        <span className="truncate max-w-[150px]">{member.email || 'No email provided'}</span>
                      </div>
                      {member.email && (
                        <button 
                          onClick={() => handleCopy(member.email, `${memberId}-email`)}
                          className="text-slate-500 hover:text-slate-350 p-1 hover:bg-slate-800/50 rounded transition-all cursor-pointer"
                          title="Copy Email"
                        >
                          {copiedId === `${memberId}-email` ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-850/50">
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-slate-500" />
                        <span>{member.phone || 'No phone provided'}</span>
                      </div>
                      {member.phone && (
                        <button 
                          onClick={() => handleCopy(member.phone, `${memberId}-phone`)}
                          className="text-slate-500 hover:text-slate-350 p-1 hover:bg-slate-800/50 rounded transition-all cursor-pointer"
                          title="Copy Phone"
                        >
                          {copiedId === `${memberId}-phone` ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer panel - edit/delete buttons */}
                {isAdmin && (
                  <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleOpenEdit(member)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/70 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      <Edit2 size={10} /> Edit
                    </button>
                    
                    {/* Cannot delete oneself directly (must use another admin) or last admin */}
                    <button 
                      onClick={() => handleDeleteMember(memberId)}
                      disabled={isSelf && member.role === 'Admin'} // An admin can delete themselves, but not if they are the last admin. However, let's allow deletes or warn them. Let's make sure it handles last admin check.
                      className="p-1.5 bg-slate-950/70 hover:bg-rose-950/50 border border-slate-850 hover:border-rose-900/60 text-slate-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title={isSelf ? "To delete your own account, another Admin must execute the action." : "Delete Member"}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Top Glow Indicator */}
            <div className="h-[2px] bg-indigo-500 w-full"></div>

            <div className="p-6 border-b border-slate-850/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <UserPlus size={16} className="text-indigo-400" />
                  Add Team Member
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Define new credentials for the CRM team</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-450 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Majharul" 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Username</label>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    placeholder="e.g. majharul" 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Password</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Set account password" 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. name@domain.com" 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +88017..." 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Access Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Agent">Agent (Read-Only access to Members)</option>
                  <option value="Admin">Admin (Full administrative controls)</option>
                </select>
              </div>

              {/* Avatar Presets */}
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avatar Picture</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: preset })}
                      className={`relative aspect-square rounded-xl overflow-hidden border bg-slate-950 transition-all cursor-pointer ${
                        formData.avatar === preset 
                          ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-650/20' 
                          : 'border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <img src={preset} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                      {formData.avatar === preset && (
                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Custom Avatar URL Input */}
                <div className="pt-1.5">
                  <span className="text-[9px] text-slate-500 block mb-1">Or enter a custom image URL:</span>
                  <input 
                    type="url" 
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://example.com/avatar.png" 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-850/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-650/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Top Glow Indicator */}
            <div className="h-[2px] bg-indigo-500 w-full"></div>

            <div className="p-6 border-b border-slate-850/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <Edit2 size={14} className="text-indigo-400" />
                  Edit Team Member
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Modify information and permissions for this account</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-450 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Majharul" 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Username</label>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    placeholder="e.g. majharul" 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Password</label>
                  <span className="text-[8px] text-indigo-400 font-semibold">Leave empty to keep existing password</span>
                </div>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Update account password" 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. name@domain.com" 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +88017..." 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Access Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Agent">Agent (Read-Only access to Members)</option>
                  <option value="Admin">Admin (Full administrative controls)</option>
                </select>
              </div>

              {/* Avatar Presets */}
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avatar Picture</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: preset })}
                      className={`relative aspect-square rounded-xl overflow-hidden border bg-slate-950 transition-all cursor-pointer ${
                        formData.avatar === preset 
                          ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-650/20' 
                          : 'border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <img src={preset} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                      {formData.avatar === preset && (
                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Custom Avatar URL Input */}
                <div className="pt-1.5">
                  <span className="text-[9px] text-slate-500 block mb-1">Or enter a custom image URL:</span>
                  <input 
                    type="url" 
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://example.com/avatar.png" 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-850/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-650/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
