import React, { useState, useEffect, useRef } from 'react';
import { get, post } from '../utils/api';
import { 
  MessageSquare, 
  MessageCircle, 
  Send, 
  User, 
  Clock, 
  Tag, 
  ChevronRight, 
  Plus, 
  X, 
  Filter, 
  Check, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  Edit2, 
  CheckCircle2, 
  XCircle, 
  MessageSquareDashed, 
  Laptop, 
  CheckSquare, 
  Trash2 
} from 'lucide-react';

const Facebook = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={props.size || 24} 
    height={props.size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={props.className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default function Tickets({ user }) {
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering & Agent Simulation States
  const [activeAgent, setActiveAgent] = useState(user?.name || 'Majharul Islam Sifat');
  const [filterTab, setFilterTab] = useState('new'); // 'new', 'picked', 'solved', 'closed'
  const [liveMode, setLiveMode] = useState(true);

  useEffect(() => {
    if (user?.name) {
      setActiveAgent(user.name);
    }
  }, [user]);
  
  // Selected Ticket details side-drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  // Detail editing states
  const [editRemarks, setEditRemarks] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editOptAgent, setEditOptAgent] = useState('');
  const [editLabels, setEditLabels] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  
  // Unpick modal states
  const [unpickModalOpen, setUnpickModalOpen] = useState(false);
  const [unpickReason, setUnpickReason] = useState('');
  const [unpickTarget, setUnpickTarget] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Fetch Tickets & Messages
  const fetchTicketsData = () => {
    get('/api/messages')
      .then(data => {
        if (data.success) {
          setTickets(data.conversations || []);
          setMessages(data.messages || []);
          setError(null);
        } else {
          setError('Failed to fetch ticket list from database');
        }
      })
      .catch(err => {
        console.error('Failed to fetch messages:', err);
        setError('Express server connection failure');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Poll for live mode updates
  useEffect(() => {
    fetchTicketsData();
    let intervalId;
    if (liveMode) {
      intervalId = setInterval(fetchTicketsData, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [liveMode]);

  // Sync edit state details ONLY when the selected ticket ID changes
  const selectedTicketKey = selectedTicket ? `${selectedTicket.platform}-${selectedTicket.participantId}` : null;
  useEffect(() => {
    if (selectedTicket) {
      setEditRemarks(selectedTicket.remarks || '');
      setEditCategory(selectedTicket.category || '');
      setEditOptAgent(selectedTicket.optAgent || '');
      setEditLabels(selectedTicket.labels ? selectedTicket.labels.join(', ') : '');
      
      // Auto-scroll chat history of the selected ticket to bottom
      setTimeout(scrollToBottom, 80);
    }
  }, [selectedTicketKey]);

  // Keep selectedTicket synchronized with latest ticket data from polling/fetches
  useEffect(() => {
    if (selectedTicket) {
      const latest = tickets.find(
        t => t.participantId === selectedTicket.participantId && t.platform === selectedTicket.platform
      );
      if (latest) {
        setSelectedTicket(latest);
      }
    }
  }, [tickets]);

  // Keep chat scrolled to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-scroll on new message addition in active ticket
  const ticketMessagesCount = selectedTicket 
    ? messages.filter(m => m.senderId === selectedTicket.participantId || m.recipientId === selectedTicket.participantId).length 
    : 0;
  
  useEffect(() => {
    if (selectedTicket) {
      scrollToBottom();
    }
  }, [ticketMessagesCount]);

  // Handle Pick Action
  const handlePickTicket = (ticket) => {
    const updatedFields = {
      platform: ticket.platform,
      participantId: ticket.participantId,
      agent: activeAgent
    };

    post('/api/conversations/update', updatedFields)
      .then(data => {
        if (data.success) {
          fetchTicketsData();
          if (selectedTicket && selectedTicket.participantId === ticket.participantId) {
            setSelectedTicket(prev => prev ? { ...prev, agent: activeAgent } : null);
          }
        }
      })
      .catch(err => console.error('Failed to pick ticket:', err));
  };

  // Handle Unpick Action (Triggers prompt modal)
  const handleUnpickTicket = (ticket) => {
    setUnpickTarget(ticket);
    setUnpickReason('');
    setUnpickModalOpen(true);
  };

  // Confirm Unpick Action
  const confirmUnpickTicket = () => {
    if (!unpickTarget || !unpickReason.trim()) return;

    const updatedFields = {
      platform: unpickTarget.platform,
      participantId: unpickTarget.participantId,
      agent: null,
      status: 'Unpicked',
      unpickBy: activeAgent,
      unpickReason: unpickReason.trim()
    };

    post('/api/conversations/update', updatedFields)
      .then(data => {
        if (data.success) {
          fetchTicketsData();
          if (selectedTicket && selectedTicket.participantId === unpickTarget.participantId) {
            setSelectedTicket(prev => {
              if (!prev) return null;
              const newHistory = [...(prev.unpickHistory || [])];
              newHistory.push({
                agent: activeAgent,
                timestamp: new Date().toISOString(),
                reason: unpickReason.trim()
              });
              return {
                ...prev,
                agent: null,
                status: 'Unpicked',
                unpickHistory: newHistory
              };
            });
          }
          setUnpickModalOpen(false);
          setUnpickReason('');
          setUnpickTarget(null);
        }
      })
      .catch(err => console.error('Failed to unpick ticket:', err));
  };

  // Handle Delete Ticket Action
  const handleDeleteTicket = (ticket) => {
    if (!ticket) return;
    const confirmMsg = `Are you sure you want to permanently delete ticket #${ticket.ticketId || ''} (${ticket.participantName}) and all its messages? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    const updatedFields = {
      platform: ticket.platform,
      participantId: ticket.participantId
    };

    post('/api/conversations/delete', updatedFields)
      .then(data => {
        if (data.success) {
          fetchTicketsData();
          if (selectedTicket && selectedTicket.participantId === ticket.participantId) {
            setSelectedTicket(null);
          }
        }
      })
      .catch(err => console.error('Failed to delete ticket:', err));
  };

  // Handle Status Update (Solve / Close)
  const handleUpdateStatus = (ticket, newStatus) => {
    const updatedFields = {
      platform: ticket.platform,
      participantId: ticket.participantId,
      status: newStatus
    };

    post('/api/conversations/update', updatedFields)
      .then(data => {
        if (data.success) {
          fetchTicketsData();
          if (selectedTicket && selectedTicket.participantId === ticket.participantId) {
            setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
          }
        }
      })
      .catch(err => console.error('Failed to update ticket status:', err));
  };

  // Save ticket fields (Remarks, Category, Labels, OptAgent)
  const handleSaveTicketDetails = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSavingDetails(true);

    const labelsArray = editLabels
      ? editLabels.split(',').map(l => l.trim()).filter(Boolean)
      : [];

    const updatedFields = {
      platform: selectedTicket.platform,
      participantId: selectedTicket.participantId,
      remarks: editRemarks,
      category: editCategory,
      optAgent: editOptAgent,
      labels: labelsArray
    };

    post('/api/conversations/update', updatedFields)
      .then(data => {
        if (data.success) {
          fetchTicketsData();
          setSelectedTicket(prev => prev ? { 
            ...prev, 
            remarks: editRemarks,
            category: editCategory,
            optAgent: editOptAgent,
            labels: labelsArray
          } : null);
        }
      })
      .catch(err => console.error('Failed to update ticket details:', err))
      .finally(() => {
        setSavingDetails(false);
      });
  };

  // Send Reply Message
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    
    setSendingReply(true);
    const bodyPayload = {
      platform: selectedTicket.platform,
      recipientId: selectedTicket.participantId,
      text: replyText
    };

    post('/api/messages/send', bodyPayload)
      .then(data => {
        if (data.success) {
          setReplyText('');
          fetchTicketsData();
          setTimeout(scrollToBottom, 100);
        }
      })
      .catch(err => console.error('Failed to send reply:', err))
      .finally(() => {
        setSendingReply(false);
      });
  };

  // Filter visibility list
  const filteredTickets = tickets.filter(ticket => {
    // 1. Hide if assigned to another agent
    if (ticket.agent && ticket.agent !== activeAgent) {
      return false;
    }

    // 2. Filter by selected Tab status group
    switch (filterTab) {
      case 'new':
        // Only unassigned tickets
        return !ticket.agent && (ticket.status === 'New' || ticket.status === 'Unpicked');
      case 'picked':
        // Tickets picked by the current activeAgent
        return ticket.agent === activeAgent && (ticket.status === 'New' || ticket.status === 'Unpicked');
      case 'solved':
        return ticket.status === 'Solved';
      case 'closed':
        return ticket.status === 'Closed';
      default:
        return true;
    }
  });

  const getSourceIcon = (ticket) => {
    if (ticket.platform === 'whatsapp') {
      return <MessageCircle size={14} className="text-emerald-500" />;
    }
    if (ticket.category === 'Comment') {
      return <MessageSquareDashed size={14} className="text-amber-500" />;
    }
    return <Facebook size={14} className="text-blue-500" />;
  };

  const getSourceLabel = (ticket) => {
    if (ticket.platform === 'whatsapp') {
      return `WhatsApp`;
    }
    if (ticket.category === 'Comment') {
      return `FB Comment`;
    }
    return `Messenger`;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'New':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Unpicked':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Solved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Closed':
        return 'bg-slate-700/30 text-slate-400 border border-slate-700/50';
      default:
        return 'bg-slate-700/30 text-slate-400 border border-slate-700/50';
    }
  };

  // Get conversation messages
  const activeTicketMessages = selectedTicket 
    ? messages.filter(m => m.senderId === selectedTicket.participantId || m.recipientId === selectedTicket.participantId)
    : [];

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col gap-6">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Ticket Analysis 
            {liveMode && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Triaging and routing incoming social inquiries, remarks, and direct DMs.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Simulation Active Agent Switcher */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Simulating Agent:</span>
            <select 
              value={activeAgent}
              onChange={(e) => {
                setActiveAgent(e.target.value);
                // Clear selected ticket if it belongs to someone else now
                if (selectedTicket && selectedTicket.agent && selectedTicket.agent !== e.target.value) {
                  setSelectedTicket(null);
                }
              }}
              className="bg-transparent text-xs text-indigo-400 font-bold focus:outline-none cursor-pointer border-none p-0"
            >
              <option value="Majharul Islam Sifat">Majharul Islam Sifat</option>
              <option value="Support Member A">Support Member A</option>
              <option value="Support Member B">Support Member B</option>
            </select>
          </div>

          {/* Live Mode Toggle */}
          <button 
            onClick={() => setLiveMode(!liveMode)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              liveMode 
                ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <RefreshCw size={12} className={liveMode ? 'animate-spin' : ''} />
            {liveMode ? 'Live Mode: ON' : 'Live Mode: OFF'}
          </button>

          {/* Refresh Button */}
          <button 
            onClick={fetchTicketsData}
            className="p-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex gap-6 items-start relative min-h-[500px]">
        
        {/* Left Side: Ticket Filters and Table */}
        <div className="flex-1 min-w-0 bg-slate-900/20 rounded-xl border border-slate-800/80 overflow-hidden flex flex-col">
          
          {/* Status Tab Filter Header */}
          <div className="flex border-b border-slate-800/80 bg-slate-950/40 p-2 gap-1.5">
            {[
              { id: 'new', label: 'New / Inbound' },
              { id: 'picked', label: 'My Picked' },
              { id: 'solved', label: 'Solved' },
              { id: 'closed', label: 'Closed' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                  filterTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-indigo-500 animate-spin mb-3"></div>
                <p className="text-xs">Synchronizing local ticketing database...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-red-400 gap-2">
                <AlertCircle size={24} />
                <p className="text-sm font-semibold">{error}</p>
                <button 
                  onClick={fetchTicketsData}
                  className="mt-2 px-3 py-1 bg-slate-800 text-slate-200 text-xs rounded hover:bg-slate-750 border border-slate-700"
                >
                  Retry Connection
                </button>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-dashed border-slate-850 rounded-lg">
                <Info size={32} className="text-slate-700 mb-2" />
                <p className="text-sm font-medium">No tickets found in this segment</p>
                <p className="text-xs text-slate-600 mt-1">Any incoming chats or comments matching this filter will queue here.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-semibold bg-slate-950/20">
                    <th className="py-1.5 px-2.5 w-16">ID</th>
                    <th className="py-1.5 px-2.5">Owner</th>
                    <th className="py-1.5 px-2.5">Source</th>
                    <th className="py-1.5 px-2.5">Title</th>
                    <th className="py-1.5 px-2.5">Referral Title</th>
                    <th className="py-1.5 px-2.5">Time</th>
                    <th className="py-1.5 px-2.5">Status</th>
                    <th className="py-1.5 px-2.5">Remarks</th>
                    <th className="py-1.5 px-2.5">Agent</th>
                    <th className="py-1.5 px-2.5">OPT Agent</th>
                    <th className="py-1.5 px-2.5">Category</th>
                    <th className="py-1.5 px-2.5">Labels</th>
                    <th className="py-1.5 px-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-[11px]">
                  {filteredTickets.map((ticket) => {
                    const isSelected = selectedTicket && selectedTicket.participantId === ticket.participantId;
                    return (
                      <tr 
                        key={`${ticket.platform}-${ticket.participantId}`}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`transition-colors cursor-pointer group hover:bg-slate-850/30 ${
                          isSelected ? 'bg-indigo-600/10 hover:bg-indigo-600/15 border-l-2 border-indigo-500' : ''
                        }`}
                      >
                        {/* ID */}
                        <td className="py-1.5 px-2.5 font-mono text-slate-400 group-hover:text-slate-200">
                          #{ticket.ticketId || 'N/A'}
                        </td>
                        
                        {/* Owner */}
                        <td className="py-1.5 px-2.5">
                          <div className="flex items-center gap-2">
                            {ticket.pictureUrl ? (
                              <img 
                                src={ticket.pictureUrl} 
                                alt={ticket.participantName} 
                                className="w-5 h-5 rounded-full object-cover border border-slate-800"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[9px] text-slate-400">
                                {ticket.participantName ? ticket.participantName.charAt(0) : 'U'}
                              </div>
                            )}
                            <span className="font-semibold text-slate-200 truncate max-w-[80px]" title={ticket.participantName}>
                              {ticket.participantName}
                            </span>
                          </div>
                        </td>
                        
                        {/* Source */}
                        <td className="py-1.5 px-2.5">
                          <div className="flex items-center gap-1 text-slate-300">
                            {getSourceIcon(ticket)}
                            <span className="text-[10px] truncate max-w-[70px]" title={getSourceLabel(ticket)}>
                              {getSourceLabel(ticket)}
                            </span>
                          </div>
                        </td>

                        {/* Title (platform icon + message snippet) */}
                        <td className="py-1.5 px-2.5">
                          <div className="flex items-center gap-1.5 max-w-[140px] truncate">
                            {getSourceIcon(ticket)}
                            <span className="text-slate-300 truncate" title={ticket.lastMessage}>
                              {ticket.lastMessage || '(Empty Message)'}
                            </span>
                          </div>
                        </td>

                        {/* Referral Title */}
                        <td className="py-1.5 px-2.5 text-slate-400 font-mono text-[10px] truncate max-w-[100px]" title={ticket.referralTitle}>
                          {ticket.referralTitle || '-'}
                        </td>

                        {/* Time */}
                        <td className="py-1.5 px-2.5 text-slate-500 whitespace-nowrap">
                          {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
                        </td>

                        {/* Status */}
                        <td className="py-1.5 px-2.5">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${getStatusClass(ticket.status)}`}>
                            {ticket.status === 'Unpicked' ? 'Open/Triage' : ticket.status}
                          </span>
                        </td>

                        {/* Remarks */}
                        <td className="py-1.5 px-2.5 text-slate-400 truncate max-w-[100px]" title={ticket.remarks}>
                          {ticket.remarks || '-'}
                        </td>

                        {/* Agent / Unpick details */}
                        <td className="py-1.5 px-2.5 text-slate-300 font-medium">
                          {ticket.agent ? (
                            <div className="flex items-center gap-1">
                              <User size={10} className="text-indigo-400" />
                              <span className="truncate max-w-[80px]" title={ticket.agent}>{ticket.agent}</span>
                            </div>
                          ) : ticket.unpickHistory && ticket.unpickHistory.length > 0 ? (
                            (() => {
                              const latestUnpick = ticket.unpickHistory[ticket.unpickHistory.length - 1];
                              return (
                                <div className="flex flex-col text-[10px] leading-tight text-slate-400 max-w-[120px]" title={`Unpicked by ${latestUnpick.agent} (${new Date(latestUnpick.timestamp).toLocaleTimeString()})${latestUnpick.reason ? '\nReason: ' + latestUnpick.reason : ''}`}>
                                  <span className="font-semibold text-amber-500 flex items-center gap-0.5 truncate">
                                    <span className="text-[8px]">↩</span> {latestUnpick.agent}
                                  </span>
                                  {latestUnpick.reason && (
                                    <span className="text-[8px] text-slate-500 italic truncate">
                                      {latestUnpick.reason}
                                    </span>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* OPT Agent */}
                        <td className="py-1.5 px-2.5 text-slate-400 truncate max-w-[80px]" title={ticket.optAgent}>
                          {ticket.optAgent || '-'}
                        </td>

                        {/* Category */}
                        <td className="py-1.5 px-2.5">
                          {ticket.category ? (
                            <span className="px-1 py-0.2 rounded bg-slate-800 text-[9px] text-slate-300 border border-slate-700/60 font-semibold">
                              {ticket.category}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Labels */}
                        <td className="py-1.5 px-2.5">
                          <div className="flex flex-wrap gap-0.5 max-w-[80px]">
                            {ticket.labels && ticket.labels.length > 0 ? (
                              ticket.labels.map((lbl, i) => (
                                <span key={i} className="px-1 py-0.2 rounded bg-indigo-500/10 text-[8px] text-indigo-400 border border-indigo-500/20">
                                  {lbl}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="py-1.5 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          {!ticket.agent ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handlePickTicket(ticket)}
                                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all text-[10px]"
                              >
                                Pick
                              </button>
                              <button
                                onClick={() => handleDeleteTicket(ticket)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all"
                                title="Delete Ticket"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ) : ticket.agent === activeAgent ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleUnpickTicket(ticket)}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded border border-slate-750 transition-all text-[10px]"
                              >
                                Unpick
                              </button>
                              <select 
                                onChange={(e) => handleUpdateStatus(ticket, e.target.value)}
                                value={ticket.status}
                                className="px-1 py-0.5 bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 rounded font-semibold text-[9px] focus:outline-none cursor-pointer"
                              >
                                <option value="Unpicked">Open/Triage</option>
                                <option value="Solved">Solve</option>
                                <option value="Closed">Close</option>
                              </select>
                              <button
                                onClick={() => handleDeleteTicket(ticket)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all"
                                title="Delete Ticket"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Busy</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side Details Side-Drawer Panel */}
        {selectedTicket && (
          <div className="w-[450px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col sticky top-24 max-h-[calc(100vh-10rem)] transition-all animate-in slide-in-from-right duration-250 z-10 flex-shrink-0">
            {/* Detail Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Ticket Details</span>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mt-0.5">
                  <span>#{selectedTicket.ticketId || 'N/A'} - {selectedTicket.participantName}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${getStatusClass(selectedTicket.status)}`}>
                    {selectedTicket.status === 'Unpicked' ? 'Open/Triage' : selectedTicket.status}
                  </span>
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Scrollable container with details & chats */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Ticket State Control (Remarks, OptAgent, Labels, Category) */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/60">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit2 size={10} /> Ticket Metadata
                  </h4>
                  {selectedTicket.agent ? (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-900/30">
                      <User size={10} className="text-indigo-400" /> Managed by {selectedTicket.agent}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">Unassigned Ticket</span>
                  )}
                </div>

                <form onSubmit={handleSaveTicketDetails} className="space-y-3">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-semibold mb-1 uppercase">Remarks / Notes</label>
                    <textarea 
                      value={editRemarks}
                      onChange={(e) => setEditRemarks(e.target.value)}
                      placeholder="Enter remarks, dispatch notes, customer intent, etc."
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 resize-none h-14"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-slate-500 font-semibold mb-1 uppercase">Category</label>
                      <input 
                        type="text" 
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        placeholder="e.g. Sales, Return"
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 font-semibold mb-1 uppercase">OPT Agent</label>
                      <input 
                        type="text" 
                        value={editOptAgent}
                        onChange={(e) => setEditOptAgent(e.target.value)}
                        placeholder="Co-Agent Name"
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-500 font-semibold mb-1 uppercase">Labels (Comma Separated)</label>
                    <input 
                      type="text" 
                      value={editLabels}
                      onChange={(e) => setEditLabels(e.target.value)}
                      placeholder="e.g. VIP, Urgent, Complaint"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    {/* Pick/Unpick toggling inside details */}
                    <div className="flex items-center gap-2">
                      {!selectedTicket.agent ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handlePickTicket(selectedTicket)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs transition-colors"
                          >
                            Pick Ticket
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(selectedTicket)}
                            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold rounded text-xs border border-red-500/20 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      ) : selectedTicket.agent === activeAgent ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUnpickTicket(selectedTicket)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold border border-slate-750 rounded text-xs transition-colors"
                          >
                            Unpick Ticket
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(selectedTicket)}
                            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold rounded text-xs border border-red-500/20 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-red-400 font-semibold italic">Owned by {selectedTicket.agent}</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={savingDetails}
                      className="px-4.5 py-1.5 bg-slate-800 hover:bg-indigo-600 disabled:bg-slate-800 text-slate-300 hover:text-white font-bold rounded text-xs border border-slate-750 hover:border-indigo-500 transition-all flex items-center gap-1.5"
                    >
                      {savingDetails ? 'Saving...' : 'Save Meta'}
                    </button>
                  </div>
                </form>

                {/* Unpick History Section */}
                {selectedTicket.unpickHistory && selectedTicket.unpickHistory.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-850/60">
                    <h5 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                      <Clock size={10} /> Unpick History / Timeline
                    </h5>
                    <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-850/60 space-y-2.5 max-h-32 overflow-y-auto">
                      {selectedTicket.unpickHistory.map((history, idx) => (
                        <div key={idx} className="flex flex-col text-[10px] text-slate-400 border-b border-slate-800/20 pb-2 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-300 truncate max-w-[150px]">{history.agent}</span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {new Date(history.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          {history.reason && (
                            <div className="text-[9px] text-slate-500 italic mt-1 pl-2 border-l border-amber-500/40">
                              Reason: {history.reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Thread Container */}
              <div className="border border-slate-850 bg-slate-950/20 rounded-xl overflow-hidden flex flex-col h-[280px]">
                <div className="px-3 py-2 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare size={10} /> Conversation Feed
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {activeTicketMessages.length} Messages
                  </span>
                </div>

                {/* Message display list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs flex flex-col">
                  {activeTicketMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-1">
                      <MessageCircle size={24} className="opacity-40" />
                      <p className="text-[10px]">No messages indexed yet</p>
                    </div>
                  ) : (
                    activeTicketMessages.map((msg) => {
                      const isOutgoing = msg.senderId !== selectedTicket.participantId;
                      return (
                        <div 
                          key={msg._id || msg.timestamp}
                          className={`max-w-[85%] rounded-lg p-2.5 leading-relaxed flex flex-col ${
                            isOutgoing 
                              ? 'self-end bg-indigo-600/20 text-indigo-100 border border-indigo-500/20' 
                              : 'self-start bg-slate-850/60 text-slate-200 border border-slate-800'
                          }`}
                        >
                          <p>{msg.text}</p>
                          <span className="text-[8px] text-slate-500 self-end mt-1 font-mono">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Message text input */}
                {selectedTicket.agent === activeAgent ? (
                  <form onSubmit={handleSendReply} className="p-2 border-t border-slate-850 bg-slate-950 flex gap-2">
                    <input 
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response to the customer..."
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
                      disabled={sendingReply}
                    />
                    <button 
                      type="submit" 
                      disabled={sendingReply || !replyText.trim()}
                      className="p-1.5 bg-indigo-600 disabled:bg-slate-800 hover:bg-indigo-500 text-white disabled:text-slate-500 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                    >
                      <Send size={12} />
                    </button>
                  </form>
                ) : (
                  <div className="p-2.5 bg-slate-950 text-center border-t border-slate-850 text-[10px] text-slate-500 italic">
                    You must pick this ticket to reply to the user.
                  </div>
                )}
              </div>
              
              {/* Close/Solve actions for assigned agent */}
              {selectedTicket.agent === activeAgent && selectedTicket.status !== 'Solved' && selectedTicket.status !== 'Closed' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket, 'Solved')}
                    className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20"
                  >
                    <CheckCircle2 size={12} /> Resolve Ticket
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket, 'Closed')}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-750 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={12} /> Close Ticket
                  </button>
                </div>
              )}

            </div>
          </div>
        )}



      </div>

      {/* Unpick Reason Prompt Modal */}
      {unpickModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[400px] bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock size={16} className="text-amber-500" /> Confirm Unpick Ticket
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to return this ticket to the inbound queue? Please provide a reason.
              </p>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1.5">Unpick Reason</label>
              <textarea
                value={unpickReason}
                onChange={(e) => setUnpickReason(e.target.value)}
                placeholder="e.g. Needs technical support, customer offline, wrong department..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25 resize-none h-24 placeholder-slate-600"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setUnpickModalOpen(false);
                  setUnpickReason('');
                  setUnpickTarget(null);
                }}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnpickTicket}
                disabled={!unpickReason.trim()}
                className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/20 hover:border-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600/20 disabled:hover:text-amber-400 disabled:hover:border-amber-500/20 rounded-xl text-xs font-bold transition-all"
              >
                Confirm Unpick
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
