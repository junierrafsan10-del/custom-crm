import React, { useState, useEffect } from 'react';
import { get, put } from '../utils/api';
import { 
  Users, 
  MessageSquare, 
  Phone, 
  CheckSquare, 
  AlertCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filterDate, setFilterDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [filterMode, setFilterMode] = useState('future'); // 'future' or 'specific'
  const [activeSection, setActiveSection] = useState('all'); // 'all', 'previous', 'upcoming'

  useEffect(() => {
    get('/api/leads')
      .then(data => {
        if (data.success && data.data) {
          setLeads(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch dashboard leads:', err));
  }, []);

  const getStageCount = (stageName) => {
    return leads.filter(l => (l.stage || '').toLowerCase() === stageName.toLowerCase()).length;
  };

  // Stats counts computed dynamically from backend/db
  const stats = [
    { label: 'Intake', count: getStageCount('Intake'), class: 'gradient-card-intake', textColor: 'text-amber-500' },
    { label: 'Interested', count: getStageCount('Interested'), class: 'gradient-card-interested', textColor: 'text-indigo-500' },
    { label: 'Qualified', count: getStageCount('Qualified'), class: 'gradient-card-qualified', textColor: 'text-purple-500' },
    { label: 'Converted', count: getStageCount('Converted'), class: 'gradient-card-converted', textColor: 'text-emerald-500' },
    { label: 'Lost', count: getStageCount('Lost'), class: 'gradient-card-lost', textColor: 'text-red-500' },
  ];



  // Extract all followups from leads
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

  // Calculate counts based on current date/time
  const previousPendingCount = followupsList.filter(f => !f.notified && new Date(f.dueDateTime) < now).length;
  const upcomingPendingCount = followupsList.filter(f => !f.notified && new Date(f.dueDateTime) >= now).length;

  // Filter based on filterDate & filterMode
  const filteredFollowups = followupsList.filter(f => {
    const dueDate = new Date(f.dueDateTime);
    const targetDate = new Date(filterDate + 'T00:00:00');
    
    const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const targetDateMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    if (filterMode === 'future') {
      return dueDateMidnight >= targetDateMidnight;
    } else {
      // From Past To Date: due date is on or before targetDate
      return dueDateMidnight <= targetDateMidnight;
    }
  });

  // Filter based on activeSection (pills selection)
  const finalFollowups = filteredFollowups.filter(f => {
    const dueDate = new Date(f.dueDateTime);
    if (activeSection === 'previous') {
      return !f.notified && dueDate < now;
    }
    if (activeSection === 'upcoming') {
      return !f.notified && dueDate >= now;
    }
    return true; // 'all'
  });

  // Sort chronologically
  finalFollowups.sort((a, b) => new Date(a.dueDateTime) - new Date(b.dueDateTime));

  const formatDueAt = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${day} ${month} ${year} ${hours}:${minutes}:${seconds} ${ampm}`;
  };

  const handleCompleteFollowup = (leadId, followupTitle, dueDateTime) => {
    const lead = leads.find(l => (l._id || l.id) === leadId);
    if (!lead) return;

    const updatedFollowups = lead.followups.map(f => {
      if (f.title === followupTitle && f.dueDateTime === dueDateTime) {
        return { ...f, notified: true };
      }
      return f;
    });

    put(`/api/leads/${leadId}`, { followups: updatedFollowups })
      .then(() => get('/api/leads'))
      .then(d => {
        if (d.success && d.data) {
          setLeads(d.data);
        }
      })
      .catch(err => console.error('Error completing followup:', err));
  };



  return (
    <div className="space-y-6">
      
      {/* 1. My Leads Stat Cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">My Leads</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className={`p-5 rounded-xl glass-panel ${stat.class} shadow-lg shadow-slate-950/20`}
            >
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.textColor}`}>{stat.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Lead Followups Section */}
      <div className="p-6 rounded-xl glass-panel border border-slate-800">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">Lead Followups</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Date Input */}
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500/60"
            />
            
            {/* Mode Select */}
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500/60"
            >
              <option value="future">From Date To Future</option>
              <option value="past">From Past To Date</option>
            </select>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === 'previous' ? 'all' : 'previous')}
            className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold transition-all border ${
              activeSection === 'previous'
                ? 'bg-rose-600/20 text-rose-400 border-rose-500'
                : 'bg-rose-500/5 text-rose-500/70 border-rose-500/10 hover:bg-rose-500/10'
            }`}
          >
            <span>Previous Pending Followups</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded-full text-[10px] text-slate-350 border border-slate-800">
              {previousPendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection(activeSection === 'upcoming' ? 'all' : 'upcoming')}
            className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold transition-all border ${
              activeSection === 'upcoming'
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500'
                : 'bg-indigo-500/5 text-indigo-500/70 border-indigo-500/10 hover:bg-indigo-500/10'
            }`}
          >
            <span>Upcoming Pending Followups</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded-full text-[10px] text-slate-350 border border-slate-800">
              {upcomingPendingCount}
            </span>
          </button>
        </div>
        
        {finalFollowups.length > 0 ? (
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-indigo-600/90 text-white text-xs font-semibold border-b border-indigo-500/20">
                  <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Lead Title</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Followup Title</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Due At</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Status</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Created At</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[10px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40 text-xs text-slate-300">
                {finalFollowups.map((f, index) => {
                  const isOverdue = new Date(f.dueDateTime) < now && !f.notified;
                  return (
                    <tr 
                      key={index} 
                      className={`transition-colors ${
                        isOverdue 
                          ? 'bg-rose-500/5 hover:bg-rose-500/10 border-l-4 border-rose-500/80' 
                          : 'hover:bg-slate-900/30'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{f.leadName}</td>
                      <td className="py-3.5 px-4 font-medium">{f.title}</td>
                      <td className="py-3.5 px-4">{formatDueAt(f.dueDateTime)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          f.notified 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : isOverdue 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {f.notified ? 'Complete' : isOverdue ? 'Failed' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{formatDueAt(f.leadCreatedAt)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCompleteFollowup(f.leadId, f.title, f.dueDateTime)}
                            disabled={f.notified}
                            className="text-[11px] font-bold px-3 py-1 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-indigo-400"
                          >
                            Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigate('/leads');
                            }}
                            className="text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
                          >
                            View Lead
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
          /* Placeholder UI */
          <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-800 rounded-lg bg-slate-900/10">
            <AlertCircle size={32} className="text-slate-600 mb-2" />
            <p className="text-sm text-slate-400 font-medium">No follow-ups scheduled for this period</p>
            <p className="text-xs text-slate-600 mt-1">Scheduled follow-up leads will appear here automatically</p>
          </div>
        )}
      </div>
    </div>
  );
}
