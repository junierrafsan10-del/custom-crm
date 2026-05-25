import { useState, useEffect } from 'react';
import { get, post, put, del } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  ArrowRight,
  X,
  Inbox
} from 'lucide-react';

const stages = ['Intake', 'Interested', 'Qualified', 'Converted', 'Lost'];

const stageColors = {
  Intake: 'bg-tertiary',
  Interested: 'bg-secondary',
  Qualified: 'bg-primary-fixed-dim',
  Converted: 'bg-on-surface-variant',
  Lost: 'bg-error'
};

const stageLabels = {
  Intake: 'Discovery',
  Interested: 'Proposal',
  Qualified: 'Negotiation',
  Converted: 'Closed Won',
  Lost: 'Lost'
};

function formatValue(value) {
  const num = parseInt(String(value || '0').replace('$', '') || 0);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
  return `$${num.toLocaleString()}`;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function EmptyColumn() {
  return (
    <div className="flex flex-col items-center justify-center h-40 border border-dashed border-outline-variant/15 rounded-xl bg-surface-container-low/20">
      <Inbox size={24} className="text-on-surface-variant/20 mb-2" />
      <p className="text-xs text-on-surface-variant/40 font-medium">No deals</p>
      <p className="text-[10px] text-on-surface-variant/30 mt-0.5">Drag or add a new deal</p>
    </div>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [search] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', stage: 'Intake', source: 'Facebook', value: '' });

  useEffect(() => {
    get('/api/leads')
      .then(d => {
        if (d.success && d.data) {
          setLeads(d.data.map(l => ({ ...l, id: l._id || l.id })));
        }
      })
      .catch(err => console.error('Failed to fetch leads:', err));
  }, []);

  const filtered = leads.filter(l =>
    (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.phone || '').includes(search)
  );

  const getStageData = (stage) => {
    const items = filtered.filter(l => l.stage === stage);
    const total = items.reduce((acc, curr) => acc + parseInt(String(curr.value || '0').replace('$', '') || 0), 0);
    return { items, total, count: items.length };
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;
    post('/api/leads', { ...newLead, value: newLead.value ? `$${newLead.value}` : '$0' })
      .then(d => {
        if (d.success && d.data) {
          setLeads(p => [...p, { ...d.data, id: d.data._id || d.data.id }]);
          setNewLead({ name: '', email: '', phone: '', stage: 'Intake', source: 'Facebook', value: '' });
          setShowAddModal(false);
        }
      })
      .catch(err => { console.error('Error adding lead:', err); alert('Could not reach backend.'); });
  };

  const handleMove = (id, next) => {
    put(`/api/leads/${id}`, { stage: next })
      .then(d => { if (d.success) setLeads(p => p.map(l => l.id === id ? { ...l, stage: next } : l)); })
      .catch(err => { console.error('Error updating stage:', err); alert('Could not update stage.'); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this deal?')) return;
    del(`/api/leads/${id}`)
      .then(d => { if (d.success) setLeads(p => p.filter(l => l.id !== id)); })
      .catch(err => { console.error('Error deleting lead:', err); alert('Could not delete.'); });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface tracking-tight">Deals Pipeline</h1>
          <p className="text-sm text-on-surface-variant/70 mt-1">Manage and track your sales pipeline</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus size={16} />
          Add Deal
        </button>
      </div>

      {/* Kanban */}
      <div className="flex overflow-x-auto kanban-scroll items-start gap-5 min-w-max pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {stages.map((stage, sIdx) => {
          const { items, total, count } = getStageData(stage);
          const next = sIdx < stages.length - 1 ? stages[sIdx + 1] : null;

          return (
            <div key={stage} className="w-[300px] flex flex-col flex-shrink-0">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stageColors[stage]}`} />
                  <h3 className="text-sm font-semibold text-on-surface">{stageLabels[stage]}</h3>
                  <span className="text-[11px] font-medium text-on-surface-variant/60 bg-surface-container-high px-1.5 py-0.5 rounded-md">{count}</span>
                </div>
                <span className="text-[11px] font-medium text-on-surface-variant/60">{formatValue(total)}</span>
              </div>

              {/* Cards */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto kanban-scroll pr-1.5 pb-6 scrollbar-thin">
                <AnimatePresence>
                  {items.map((lead) => {
                    const isHighValue = parseInt(String(lead.value || '0').replace('$', '') || 0) >= 50000;
                    const isTerminal = stage === 'Converted' || stage === 'Lost';

                    return (
                      <motion.div
                        key={lead.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        {isTerminal ? (
                          <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-3.5 card-hover cursor-pointer group">
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <div className="w-7 h-7 rounded-md bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-[10px] font-bold text-on-surface flex-shrink-0">
                                {getInitials(lead.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">{lead.name}</h4>
                                <p className="text-[11px] text-on-surface-variant/60 truncate">{lead.phone}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-outline-variant/10 pt-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-on-surface-variant/50 bg-surface-container-high px-1.5 py-0.5 rounded">{lead.source}</span>
                                <button onClick={() => handleDelete(lead.id)} className="text-on-surface-variant/40 hover:text-error transition-colors p-0.5">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <span className="text-xs font-semibold text-on-surface-variant/70">{formatValue(lead.value)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className={`glass-panel rounded-xl p-4 card-hover cursor-pointer group ${isHighValue ? 'border-primary/30 relative overflow-hidden' : ''}`}>
                            {isHighValue && (
                              <>
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/60" />
                                <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/8 blur-[24px] rounded-full pointer-events-none" />
                              </>
                            )}
                            <div className="flex items-start justify-between mb-2.5 relative z-10">
                              <div className="w-7 h-7 rounded-md bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-[10px] font-bold text-on-surface flex-shrink-0">
                                {getInitials(lead.name)}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isHighValue ? (
                                  <span className="text-[10px] text-error font-semibold px-1.5 py-0.5 bg-error/10 rounded border border-error/20">Hot</span>
                                ) : lead.createdAt ? (
                                  <span className="text-[10px] text-on-surface-variant/50 px-1.5 py-0.5 bg-surface-container-low rounded border border-outline-variant/10">
                                    {Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000)}d
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <h4 className="text-sm font-semibold text-on-surface mb-0.5 group-hover:text-primary transition-colors relative z-10">{lead.name}</h4>
                            <p className="text-[11px] text-on-surface-variant/60 mb-3 relative z-10">{lead.phone}{lead.email ? ` · ${lead.email}` : ''}</p>
                            <div className="flex items-center justify-between border-t border-outline-variant/15 pt-2.5 relative z-10">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-on-surface-variant/50 bg-surface-container-high px-1.5 py-0.5 rounded">{lead.source}</span>
                                {next && (
                                  <button onClick={() => handleMove(lead.id, next)} className="p-0.5 rounded text-on-surface-variant/40 hover:text-primary transition-colors" title={`Move to ${stageLabels[next]}`}>
                                    <ArrowRight size={13} />
                                  </button>
                                )}
                                <button onClick={() => handleDelete(lead.id)} className="p-0.5 rounded text-on-surface-variant/40 hover:text-error transition-colors" title="Delete">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <span className={`font-semibold ${isHighValue ? 'text-sm text-primary' : 'text-xs text-on-surface'}`}>
                                {formatValue(lead.value)}
                              </span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {count === 0 && <EmptyColumn />}
              </div>
            </div>
          );
        })}

        {/* Add Column */}
        <div className="w-[300px] flex-shrink-0 pt-[38px]">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full h-11 rounded-xl border border-dashed border-outline-variant/25 text-on-surface-variant/50 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus size={16} /> Add Stage
          </button>
        </div>
      </div>

      {/* Add Deal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-surface-container border border-outline-variant/20 rounded-xl shadow-2xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-on-surface">Add New Deal</h3>
                <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant/50 hover:text-on-surface transition-colors p-0.5">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-on-surface-variant font-semibold mb-1.5 uppercase tracking-wider">Contact Name</label>
                  <input type="text" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} placeholder="e.g. John Doe" className="input-field" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-on-surface-variant font-semibold mb-1.5 uppercase tracking-wider">Phone</label>
                    <input type="text" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} placeholder="+88017..." className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-[10px] text-on-surface-variant font-semibold mb-1.5 uppercase tracking-wider">Email</label>
                    <input type="email" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} placeholder="name@example.com" className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-on-surface-variant font-semibold mb-1.5 uppercase tracking-wider">Stage</label>
                    <select value={newLead.stage} onChange={e => setNewLead({ ...newLead, stage: e.target.value })} className="input-field">
                      {stages.map(s => <option key={s} value={s}>{stageLabels[s]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-on-surface-variant font-semibold mb-1.5 uppercase tracking-wider">Source</label>
                    <select value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value })} className="input-field">
                      <option value="Facebook">Facebook</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Calling">Calling</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-on-surface-variant font-semibold mb-1.5 uppercase tracking-wider">Value ($)</label>
                    <input type="number" value={newLead.value} onChange={e => setNewLead({ ...newLead, value: e.target.value })} placeholder="1500" className="input-field" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/20 mt-5">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost text-xs">Cancel</button>
                  <button type="submit" className="btn-primary text-xs">Create Deal</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
