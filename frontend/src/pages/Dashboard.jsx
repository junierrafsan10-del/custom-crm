import React, { useState, useEffect } from 'react';
import { get, put } from '../utils/api';
import { motion } from 'framer-motion';
import {
  Calendar,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Target,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const stageConfig = [
  { label: 'Discovery', key: 'Intake', dotColor: 'bg-tertiary', valueColor: 'text-tertiary', icon: 'search' },
  { label: 'Proposal', key: 'Interested', dotColor: 'bg-secondary', valueColor: 'text-secondary', icon: 'description' },
  { label: 'Negotiation', key: 'Qualified', dotColor: 'bg-primary-fixed-dim', valueColor: 'text-primary-fixed-dim', icon: 'handshake' },
  { label: 'Closed Won', key: 'Converted', dotColor: 'bg-on-surface-variant', valueColor: 'text-on-surface-variant', icon: 'check_circle' },
  { label: 'Lost', key: 'Lost', dotColor: 'bg-error', valueColor: 'text-error', icon: 'cancel' },
];

function formatCurrency(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value.toLocaleString()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${h}:${m} ${ampm}`;
}

function StageCard({ stage, count, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-4 card-hover"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
        <p className="text-xs font-medium text-on-surface-variant">{stage.label}</p>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${stage.valueColor}`}>{count}</p>
      <p className="text-[11px] text-on-surface-variant/50 mt-1 font-medium">{formatCurrency(value)}</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterMode, setFilterMode] = useState('future');
  const [activeSection, setActiveSection] = useState('all');

  useEffect(() => {
    get('/api/leads')
      .then(d => { if (d.success && d.data) setLeads(d.data); })
      .catch(err => console.error('Failed to fetch dashboard leads:', err));
  }, []);

  const getStageCount = (k) => leads.filter(l => (l.stage || '').toLowerCase() === k.toLowerCase()).length;
  const getStageValue = (k) => leads
    .filter(l => (l.stage || '').toLowerCase() === k.toLowerCase())
    .reduce((acc, curr) => acc + parseInt(String(curr.value || '0').replace('$', '') || 0), 0);

  const totalActive = leads.filter(l => l.stage !== 'Lost').length;
  const totalPipelineValue = leads
    .filter(l => l.stage !== 'Lost')
    .reduce((acc, curr) => acc + parseInt(String(curr.value || '0').replace('$', '') || 0), 0);

  const followupsList = [];
  leads.forEach(lead => {
    if (Array.isArray(lead.followups)) {
      lead.followups.forEach(f => {
        followupsList.push({
          ...f,
          leadId: lead._id || lead.id,
          leadName: lead.name,
          leadPhone: lead.phone,
          leadStage: lead.stage,
          leadCreatedAt: lead.createdAt || new Date().toISOString()
        });
      });
    }
  });

  const now = new Date();
  const previousPendingCount = followupsList.filter(f => !f.notified && new Date(f.dueDateTime) < now).length;
  const upcomingPendingCount = followupsList.filter(f => !f.notified && new Date(f.dueDateTime) >= now).length;

  const filteredFollowups = followupsList.filter(f => {
    const dueDate = new Date(f.dueDateTime);
    const targetDate = new Date(filterDate + 'T00:00:00');
    const d1 = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const d2 = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    return filterMode === 'future' ? d1 >= d2 : d1 <= d2;
  });

  const finalFollowups = filteredFollowups.filter(f => {
    const dueDate = new Date(f.dueDateTime);
    if (activeSection === 'previous') return !f.notified && dueDate < now;
    if (activeSection === 'upcoming') return !f.notified && dueDate >= now;
    return true;
  }).sort((a, b) => new Date(a.dueDateTime) - new Date(b.dueDateTime));

  const handleCompleteFollowup = (leadId, title, dueDateTime) => {
    const lead = leads.find(l => (l._id || l.id) === leadId);
    if (!lead) return;
    const updated = lead.followups.map(f =>
      f.title === title && f.dueDateTime === dueDateTime ? { ...f, notified: true } : f
    );
    put(`/api/leads/${leadId}`, { followups: updated })
      .then(() => get('/api/leads'))
      .then(d => { if (d.success && d.data) setLeads(d.data); })
      .catch(err => console.error('Error completing followup:', err));
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight">Dashboard</h1>
        <p className="text-sm text-on-surface-variant/70 mt-1">Pipeline overview and pending follow-ups</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel rounded-xl p-4 card-hover"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">Pipeline Value</p>
              <p className="text-xl font-bold text-on-surface tracking-tight">{formatCurrency(totalPipelineValue)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-xl p-4 card-hover"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Target size={18} className="text-secondary" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">Active Deals</p>
              <p className="text-xl font-bold text-on-surface tracking-tight">{totalActive}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel rounded-xl p-4 card-hover"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary-fixed-dim/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-primary-fixed-dim" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">Avg Deal Value</p>
              <p className="text-xl font-bold text-on-surface tracking-tight">
                {totalActive ? formatCurrency(Math.round(totalPipelineValue / totalActive)) : '$0'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pipeline Stages */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Pipeline Stages</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stageConfig.map((stage, idx) => (
            <StageCard
              key={stage.key}
              stage={stage}
              count={getStageCount(stage.key)}
              value={getStageValue(stage.key)}
            />
          ))}
        </div>
      </div>

      {/* Follow-ups Section */}
      <div className="glass-panel rounded-xl border border-outline-variant/20">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2.5">
              <Calendar size={16} className="text-primary" />
              <h2 className="text-base font-bold text-on-surface">Follow-ups</h2>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input-field w-auto"
              />
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="input-field w-auto"
              >
                <option value="future">Future</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => setActiveSection(activeSection === 'previous' ? 'all' : 'previous')}
              className={`badge transition-all cursor-pointer ${
                activeSection === 'previous'
                  ? 'bg-error/15 text-error border-error/30'
                  : 'bg-transparent text-on-surface-variant/60 border-outline-variant/20 hover:border-error/30 hover:text-error/80'
              }`}
            >
              <Clock size={12} />
              Overdue
              <span className="ml-1 text-[10px] opacity-70">{previousPendingCount}</span>
            </button>

            <button
              onClick={() => setActiveSection(activeSection === 'upcoming' ? 'all' : 'upcoming')}
              className={`badge transition-all cursor-pointer ${
                activeSection === 'upcoming'
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-transparent text-on-surface-variant/60 border-outline-variant/20 hover:border-primary/30 hover:text-primary/80'
              }`}
            >
              <Calendar size={12} />
              Upcoming
              <span className="ml-1 text-[10px] opacity-70">{upcomingPendingCount}</span>
            </button>
          </div>

          {finalFollowups.length > 0 ? (
            <div className="overflow-x-auto border border-outline-variant/10 rounded-xl bg-surface-container-low/10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="table-header">
                    <th>Lead</th>
                    <th>Follow-up</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {finalFollowups.map((f, i) => {
                    const overdue = new Date(f.dueDateTime) < now && !f.notified;
                    return (
                      <tr
                        key={i}
                        className={`table-row ${overdue ? 'border-l-2 border-error/60 bg-error/3' : ''}`}
                      >
                        <td className="font-semibold text-on-surface">{f.leadName}</td>
                        <td className="text-on-surface-variant">{f.title}</td>
                        <td className="text-on-surface-variant/80">{formatDate(f.dueDateTime)}</td>
                        <td>
                          <span className={`badge text-[10px] ${
                            f.notified
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : overdue
                                ? 'bg-error/10 text-error border-error/20'
                                : 'bg-primary/8 text-primary border-primary/15'
                          }`}>
                            {f.notified ? 'Complete' : overdue ? 'Overdue' : 'Pending'}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleCompleteFollowup(f.leadId, f.title, f.dueDateTime)}
                              disabled={f.notified}
                              className="btn-ghost text-xs py-1 px-2.5 disabled:opacity-30"
                            >
                              <CheckCircle2 size={13} />
                              Complete
                            </button>
                            <button
                              onClick={() => navigate('/leads')}
                              className="btn-ghost text-xs py-1 px-2.5"
                            >
                              <ArrowRight size={13} />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
                <Calendar size={22} className="text-on-surface-variant/40" />
              </div>
              <p className="text-sm font-medium text-on-surface-variant">No follow-ups found</p>
              {activeSection === 'previous' ? (
                <p className="text-xs text-on-surface-variant/50 mt-1">No overdue follow-ups. Great work!</p>
              ) : activeSection === 'upcoming' ? (
                <p className="text-xs text-on-surface-variant/50 mt-1">No upcoming follow-ups scheduled.</p>
              ) : (
                <p className="text-xs text-on-surface-variant/50 mt-1">Schedule a follow-up from a deal to see it here.</p>
              )}
              <button
                onClick={() => navigate('/leads')}
                className="btn-primary mt-4 text-xs"
              >
                <Target size={14} />
                View Pipeline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
