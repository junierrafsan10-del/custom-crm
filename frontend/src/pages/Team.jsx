import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Phone,
  Trash2,
  CheckSquare,
  Lock
} from 'lucide-react';

export default function Team() {
  const [members, setMembers] = useState([
    { id: 1, name: 'Majharul Islam Sifat', role: 'Admin', email: 'sifat@example.com', phone: '+8801700000000', leads: 42, tasks: 12 },
    { id: 2, name: 'Support Member A', role: 'Support Member', email: 'member.a@example.com', phone: '+8801711111111', leads: 24, tasks: 5 },
    { id: 3, name: 'Support Member B', role: 'Support Member', email: 'member.b@example.com', phone: '+8801722222222', leads: 15, tasks: 8 }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', phone: '', role: 'Support Member' });

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    setMembers([
      ...members,
      {
        id: members.length + 1,
        ...newMember,
        leads: 0,
        tasks: 0
      }
    ]);
    setNewMember({ name: '', email: '', phone: '', role: 'Support Member' });
    setShowAddModal(false);
  };

  const handleDeleteMember = (id) => {
    setMembers(members.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      
      {/* Actions */}
      <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <Users className="text-indigo-400" size={18} />
          <h2 className="text-sm font-bold text-slate-200">Active Team Members ({members.length})</h2>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all shadow-lg"
        >
          <UserPlus size={14} /> Add Member
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member.id} className="p-6 rounded-xl glass-panel border border-slate-800 flex flex-col justify-between shadow-lg">
            
            {/* Header info */}
            <div>
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-base text-slate-300">
                  {member.name.charAt(0)}
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                  member.role === 'Admin' 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {member.role}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-100">{member.name}</h3>
              
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-slate-500" />
                  <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-slate-500" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats and delete */}
            <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between">
              <div className="flex gap-4 text-xs text-slate-400">
                <div>
                  <span className="text-[10px] text-slate-500 block">Leads</span>
                  <span className="font-bold text-slate-200">{member.leads}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Tasks</span>
                  <span className="font-bold text-slate-200">{member.tasks}</span>
                </div>
              </div>

              {member.role !== 'Admin' && (
                <button 
                  onClick={() => handleDeleteMember(member.id)}
                  className="p-2 rounded bg-slate-900 hover:bg-red-950 text-slate-500 hover:text-red-400 border border-slate-850 hover:border-red-900 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4">Add Team Member</h3>
            
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="e.g. Support Member C" 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="e.g. member.c@example.com" 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Phone Number</label>
                  <input 
                    type="text" 
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    placeholder="e.g. +88017..." 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Access Role</label>
                  <select 
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Support Member">Support Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/10"
                >
                  Invite Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
