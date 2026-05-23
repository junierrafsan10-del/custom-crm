import React, { useState, useEffect } from 'react';
import { get, post, put, del } from '../utils/api';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Phone,
  Trash2
} from 'lucide-react';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', stage: 'Intake', source: 'Facebook', value: '' });

  const stages = ['Intake', 'Interested', 'Qualified', 'Converted', 'Lost'];

  useEffect(() => {
    get('/api/leads')
      .then(data => {
        if (data.success && data.data) {
          const formatted = data.data.map(l => ({
            ...l,
            id: l._id || l.id
          }));
          setLeads(formatted);
        }
      })
      .catch(err => console.error('Failed to fetch leads:', err));
  }, []);

  const filteredLeads = leads.filter(lead => 
    (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.phone || '').includes(searchTerm)
  );

  const handleAddLead = (e) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;
    
    post('/api/leads', { ...newLead, value: newLead.value ? `$${newLead.value}` : '$0' })
      .then(data => {
        if (data.success && data.data) {
          const formatted = { ...data.data, id: data.data._id || data.data.id };
          setLeads(prev => [...prev, formatted]);
          setNewLead({ name: '', email: '', phone: '', stage: 'Intake', source: 'Facebook', value: '' });
          setShowAddModal(false);
        } else {
          alert('Failed to add lead: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(err => {
        console.error('Error adding lead:', err);
        alert('Could not reach backend to add lead.');
      });
  };

  const handleMoveStage = (leadId, nextStage) => {
    put(`/api/leads/${leadId}`, { stage: nextStage })
      .then(data => {
        if (data.success) {
          setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, stage: nextStage } : lead));
        } else {
          alert('Failed to update stage: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(err => {
        console.error('Error updating stage:', err);
        alert('Could not update stage in backend.');
      });
  };

  const handleDeleteLead = (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;

    del(`/api/leads/${leadId}`)
      .then(data => {
        if (data.success) {
          setLeads(prev => prev.filter(lead => lead.id !== leadId));
        } else {
          alert('Failed to delete lead: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(err => {
        console.error('Error deleting lead:', err);
        alert('Could not delete lead in backend.');
      });
  };

  return (
    <div className="space-y-6">
      
      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads by name or phone..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-800 transition-colors w-1/2 sm:w-auto justify-center">
            <Filter size={14} /> Filter
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors w-1/2 sm:w-auto justify-center shadow-lg shadow-indigo-600/10"
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>

      {/* Kanban Stages Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = filteredLeads.filter(l => l.stage === stage);
          const totalValue = stageLeads.reduce((acc, curr) => acc + parseInt(curr.value.replace('$', '') || 0), 0);
          
          return (
            <div key={stage} className="min-w-[240px] flex flex-col bg-slate-900/10 border border-slate-800/40 rounded-xl p-4 h-[calc(100vh-14.5rem)]">
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/60">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">{stage}</h3>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">{stageLeads.length} Leads • ${totalValue}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-slate-700" />
              </div>

              {/* Stage Column Body */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {stageLeads.map((lead) => (
                  <div 
                    key={lead.id} 
                    className="p-4 rounded-lg bg-slate-900/60 border border-slate-850 hover:border-slate-700 transition-all shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">{lead.name}</h4>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            const currentIdx = stages.indexOf(stage);
                            if (currentIdx < stages.length - 1) {
                              handleMoveStage(lead.id, stages[currentIdx + 1]);
                            }
                          }}
                          title="Move Forward"
                          className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-400 transition-colors"
                        >
                          <ArrowRight size={12} />
                        </button>
                        <button 
                          onClick={() => handleDeleteLead(lead.id)}
                          title="Delete Lead"
                          className="p-0.5 hover:bg-slate-850 rounded text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-1">{lead.phone}</p>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60">
                      <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 font-medium">
                        {lead.source}
                      </span>
                      <span className="text-xs font-bold text-indigo-400">
                        {lead.value}
                      </span>
                    </div>
                  </div>
                ))}

                {stageLeads.length === 0 && (
                  <div className="h-24 flex items-center justify-center border border-dashed border-slate-800/40 rounded-lg text-[10px] text-slate-600">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4">Add New Lead</h3>
            
            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Lead Name</label>
                <input 
                  type="text" 
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="e.g. Zunayed Chowdhury" 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Phone</label>
                  <input 
                    type="text" 
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="e.g. +88017..." 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Email</label>
                  <input 
                    type="email" 
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="e.g. name@example.com" 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Stage</label>
                  <select 
                    value={newLead.stage}
                    onChange={(e) => setNewLead({ ...newLead, stage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Source</label>
                  <select 
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Calling">Calling</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Value ($)</label>
                  <input 
                    type="number" 
                    value={newLead.value}
                    onChange={(e) => setNewLead({ ...newLead, value: e.target.value })}
                    placeholder="1500" 
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
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
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
