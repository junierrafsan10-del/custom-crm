import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { get, put } from '../utils/api';
import { Calendar, TrendingUp, DollarSign, Target, Clock, ArrowRight, CheckCircle2, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SkeletonCard, SkeletonTable } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const stageConfig = [
  { label: 'Discovery', key: 'Intake', color: 'tertiary' },
  { label: 'Proposal', key: 'Interested', color: 'secondary' },
  { label: 'Negotiation', key: 'Qualified', color: 'primary-fixed-dim' },
  { label: 'Closed Won', key: 'Converted', color: 'on-surface-variant' },
  { label: 'Lost', key: 'Lost', color: 'error' },
];

function formatCurrency(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toLocaleString()}`;
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const MetricCard = memo(function MetricCard({ icon: Icon, label, value, delay = 0, color = 'primary' }) {
  const colorMap = { primary: 'bg-primary/10 text-primary', secondary: 'bg-secondary/10 text-secondary', 'primary-fixed-dim': 'bg-primary-fixed-dim/10 text-primary-fixed-dim' };
  return (
    <div className="glass-panel rounded-xl p-4 card-hover animate-fade-in" style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-on-surface mt-1.5 tracking-tight">{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg ${colorMap[color] || 'bg-primary/10 text-primary'} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
});

const StageCard = memo(function StageCard({ stage, count, value }) {
  const colorMap = {
    tertiary: 'bg-tertiary', secondary: 'bg-secondary', 'primary-fixed-dim': 'bg-primary-fixed-dim', 'on-surface-variant': 'bg-on-surface-variant', error: 'bg-error',
  };
  const textColorMap = {
    tertiary: 'text-tertiary', secondary: 'text-secondary', 'primary-fixed-dim': 'text-primary-fixed-dim', 'on-surface-variant': 'text-on-surface-variant', error: 'text-error',
  };
  return (
    <div className="glass-panel rounded-xl p-4 card-hover animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${colorMap[stage.color]}`} />
        <p className="text-xs font-medium text-on-surface-variant">{stage.label}</p>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${textColorMap[stage.color]}`}>{count}</p>
      <p className="text-[10px] text-on-surface-variant/40 mt-1 font-medium">{formatCurrency(value)}</p>
    </div>
  );
});

export default function Dashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterMode, setFilterMode] = useState('future');
  const [activeSection, setActiveSection] = useState('all');

  useEffect(() => {
    get('/api/leads')
      .then(d => { if (d.success && d.data) setLeads(d.data); })
      .catch(err => console.error('Failed to fetch dashboard leads:', err))
      .finally(() => setLoading(false));
  }, []);

  const getStageCount = useCallback((k) => leads.filter(l => (l.stage || '').toLowerCase() === k.toLowerCase()).length, [leads]);
  const getStageValue = useCallback((k) => leads.filter(l => (l.stage || '').toLowerCase() === k.toLowerCase())
    .reduce((acc, curr) => acc + parseInt(String(curr.value || '0').replace('$', '') || 0), 0), [leads]);

  const totalActive = useMemo(() => leads.filter(l => l.stage !== 'Lost').length, [leads]);
  const totalPipelineValue = useMemo(() => leads.filter(l => l.stage !== 'Lost')
    .reduce((acc, curr) => acc + parseInt(String(curr.value || '0').replace('$', '') || 0), 0), [leads]);

  const followupsList = useMemo(() => {
    const list = [];
    leads.forEach(lead => {
      if (Array.isArray(lead.followups)) {
        lead.followups.forEach(f => {
          list.push({ ...f, leadId: lead._id || lead.id, leadName: lead.name, leadPhone: lead.phone, leadStage: lead.stage, leadCreatedAt: lead.createdAt || new Date().toISOString() });
        });
      }
    });
    return list;
  }, [leads]);

  const now = useMemo(() => new Date(), []);

  const { previousPendingCount, upcomingPendingCount } = useMemo(() => ({
    previousPendingCount: followupsList.filter(f => !f.notified && new Date(f.dueDateTime) < now).length,
    upcomingPendingCount: followupsList.filter(f => !f.notified && new Date(f.dueDateTime) >= now).length,
  }), [followupsList, now]);

  const filteredFollowups = useMemo(() => followupsList.filter(f => {
    const due = new Date(f.dueDateTime);
    const target = new Date(filterDate + 'T00:00:00');
    const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const d2 = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    return filterMode === 'future' ? d1 >= d2 : d1 <= d2;
  }), [followupsList, filterDate, filterMode]);

  const finalFollowups = useMemo(() => filteredFollowups.filter(f => {
    const due = new Date(f.dueDateTime);
    if (activeSection === 'previous') return !f.notified && due < now;
    if (activeSection === 'upcoming') return !f.notified && due >= now;
    return true;
  }).sort((a, b) => new Date(a.dueDateTime) - new Date(b.dueDateTime)), [filteredFollowups, activeSection, now]);

  const handleCompleteFollowup = useCallback((leadId, title, dueDateTime) => {
    const lead = leads.find(l => (l._id || l.id) === leadId);
    if (!lead) return;
    const updated = lead.followups.map(f =>
      f.title === title && f.dueDateTime === dueDateTime ? { ...f, notified: true } : f
    );
    put(`/api/leads/${leadId}`, { followups: updated })
      .then(() => get('/api/leads'))
      .then(d => { if (d.success && d.data) setLeads(d.data); })
      .catch(err => console.error('Error completing followup:', err));
  }, [leads]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-7 w-48 bg-surface-container-high rounded-lg animate-pulse" />
        <div className="h-4 w-72 bg-surface-container-high rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={2} />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} lines={2} />)}
        </div>
        <SkeletonTable rows={4} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold text-on-surface tracking-tight">Dashboard</h1>
        <p className="text-sm text-on-surface-variant/60 mt-1">Pipeline overview and pending follow-ups</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={DollarSign} label="Pipeline Value" value={formatCurrency(totalPipelineValue)} delay={0.05} color="primary" />
        <MetricCard icon={Target} label="Active Deals" value={totalActive} delay={0.1} color="secondary" />
        <MetricCard icon={TrendingUp} label="Avg Deal Value" value={totalActive ? formatCurrency(Math.round(totalPipelineValue / totalActive)) : '$0'} delay={0.15} color="primary-fixed-dim" />
      </div>

      {/* Pipeline Stages */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Pipeline Stages</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stageConfig.map((stage) => (
            <StageCard key={stage.key} stage={stage} count={getStageCount(stage.key)} value={getStageValue(stage.key)} />
          ))}
        </div>
      </div>

      {/* Follow-ups */}
      <Card variant="glass">
        <CardHeader
          title="Follow-ups"
          action={
            <div className="flex items-center gap-2">
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                className="input-field w-auto text-xs px-2 py-1.5" />
              <select value={filterMode} onChange={e => setFilterMode(e.target.value)}
                className="input-field w-auto text-xs px-2 py-1.5">
                <option value="future">Future</option>
                <option value="past">Past</option>
              </select>
            </div>
          }
        />

        <div className="flex gap-2 mb-5">
          <button onClick={() => setActiveSection(activeSection === 'previous' ? 'all' : 'previous')}
            className={`badge text-[10px] transition-all cursor-pointer ${activeSection === 'previous' ? 'bg-error/15 text-error border-error/30' : 'bg-transparent text-on-surface-variant/50 border-outline-variant/20 hover:border-error/30 hover:text-error/70'}`}>
            <Clock size={11} /> Overdue <span className="ml-0.5 opacity-70">{previousPendingCount}</span>
          </button>
          <button onClick={() => setActiveSection(activeSection === 'upcoming' ? 'all' : 'upcoming')}
            className={`badge text-[10px] transition-all cursor-pointer ${activeSection === 'upcoming' ? 'bg-primary/15 text-primary border-primary/30' : 'bg-transparent text-on-surface-variant/50 border-outline-variant/20 hover:border-primary/30 hover:text-primary/70'}`}>
            <Calendar size={11} /> Upcoming <span className="ml-0.5 opacity-70">{upcomingPendingCount}</span>
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
                    <tr key={i} className={`table-row ${overdue ? 'border-l-2 border-error/50 bg-error/2' : ''}`}>
                      <td className="font-semibold text-on-surface text-xs">{f.leadName}</td>
                      <td className="text-on-surface-variant text-xs">{f.title}</td>
                      <td className="text-on-surface-variant/70 text-xs">{formatDate(f.dueDateTime)}</td>
                      <td>
                        <Badge color={f.notified ? 'success' : overdue ? 'error' : 'warning'} dot>
                          {f.notified ? 'Complete' : overdue ? 'Overdue' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => handleCompleteFollowup(f.leadId, f.title, f.dueDateTime)} disabled={f.notified}>
                            <CheckCircle2 size={12} /> Complete
                          </Button>
                          <Button variant="ghost" size="xs" onClick={() => navigate('/leads')}>
                            <ArrowRight size={12} /> View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Inbox}
            title="No follow-ups found"
            description={
              activeSection === 'previous' ? 'No overdue follow-ups. Great work!'
                : activeSection === 'upcoming' ? 'No upcoming follow-ups scheduled.'
                : 'Schedule a follow-up from a deal to see it here.'
            }
            action={activeSection === 'all' ? () => navigate('/leads') : undefined}
            actionLabel="View Pipeline"
          />
        )}
      </Card>
    </div>
  );
}
