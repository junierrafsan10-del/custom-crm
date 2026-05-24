import React, { useState, useEffect, useRef } from 'react';
import { get, post, put, del } from '../utils/api';
import {
  Search,
  Send,
  Plus,
  Trash2,
  Edit2,
  Clock,
  User,
  Phone
} from 'lucide-react';
import ConversationList from '../components/chat/ConversationList';
import MessageThread from '../components/chat/MessageThread';
import MessageInput from '../components/chat/MessageInput';

export default function Chat({ metaConnections, user }) {
  const [activeChat, setActiveChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [chats, setChats] = useState([]);
  const [allMessages, setAllMessages] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [rightSidebarTab, setRightSidebarTab] = useState('info');
  const [unpickModalOpen, setUnpickModalOpen] = useState(false);
  const [unpickReason, setUnpickReason] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateText, setTemplateText] = useState('');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadTitle, setLeadTitle] = useState('');
  const [leadProduct, setLeadProduct] = useState('Premium Polo Shirt');
  const [leadStage, setLeadStage] = useState('Intake');
  const [leadValue, setLeadValue] = useState('');
  const [leadSource, setLeadSource] = useState('Facebook');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [leads, setLeads] = useState([]);
  const [leadMode, setLeadMode] = useState('create');
  const [matchingLeadId, setMatchingLeadId] = useState(null);
  const [leadFollowups, setLeadFollowups] = useState([]);
  const [hasFollowUp, setHasFollowUp] = useState(false);
  const [newFollowUpTitle, setNewFollowUpTitle] = useState('');
  const [newFollowUpAgent, setNewFollowUpAgent] = useState('Majharul_Islam_Sifat');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');

  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('crm_reply_templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: '1', title: 'Greeting', text: 'Hi! Thank you for reaching out to us. How can we help you today?' },
      { id: '2', title: 'Pricing Info', text: 'Our standard pricing package details are available here. We have a basic tier starting at $29/mo.' },
      { id: '3', title: 'Discount Offer', text: 'We are currently offering a special 15% discount for first-time customers! Use code WELCOME15.' },
      { id: '4', title: 'Support Issue', text: 'I have forwarded this ticket to our technical support team. We will get back to you within 2 hours.' },
      { id: '5', title: 'Thank You', text: 'Thank you for choosing our service. Have a wonderful day!' }
    ];
  });
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);

  const PRODUCTS = [
    'Premium Polo Shirt',
    'Casual Denim Shirt',
    'Slim Fit Chino Pants',
    'Classic Cotton Panjabi',
    'Designer Leather Wallet',
    'Leather Loafers',
    'Smart Casual Blazer'
  ];

  useEffect(() => {
    localStorage.setItem('crm_reply_templates', JSON.stringify(templates));
  }, [templates]);

  const fetchLeads = () => {
    get('/api/leads')
      .then(data => {
        if (data.success && data.data) {
          setLeads(data.data);
        }
      })
      .catch(err => console.error('Error fetching leads:', err));
  };

  const handleOpenConvertModal = () => {
    if (!activeChat || currentChat.id === 'placeholder') return;

    if (matchingLead) {
      setLeadMode('update');
      setMatchingLeadId(matchingLead._id || matchingLead.id);
      setLeadName(matchingLead.name || '');
      setLeadPhone(matchingLead.phone || '');
      setLeadEmail(matchingLead.email || '');
      setLeadTitle(matchingLead.title || '');
      setLeadProduct(matchingLead.product || PRODUCTS[0]);
      setLeadStage(matchingLead.stage || 'Intake');

      let rawVal = matchingLead.value || '';
      if (rawVal.startsWith('$')) {
        rawVal = rawVal.substring(1);
      }
      setLeadValue(rawVal);
      setLeadSource(matchingLead.source || (currentChat.platform === 'whatsapp' ? 'WhatsApp' : 'Facebook'));
      setLeadFollowups(matchingLead.followups || []);
    } else {
      setLeadMode('create');
      setMatchingLeadId(null);
      setLeadName(currentChat.name || '');
      setLeadPhone(currentChat.phone === 'N/A' ? '' : (currentChat.phone || ''));
      setLeadEmail(currentChat.email === 'N/A' ? '' : (currentChat.email || ''));
      setLeadTitle('');
      setLeadProduct(PRODUCTS[0]);
      setLeadStage('Intake');
      setLeadValue('');
      setLeadSource(currentChat.platform === 'whatsapp' ? 'WhatsApp' : 'Facebook');
      setLeadFollowups([]);
    }
    setHasFollowUp(false);
    setNewFollowUpTitle('');
    setNewFollowUpDate('');
    setNewFollowUpAgent('Majharul_Islam_Sifat');
    setConvertModalOpen(true);
  };

  const handleConvertLeadSubmit = (e) => {
    e.preventDefault();
    if (!leadName.trim()) {
      alert('Name is required');
      return;
    }

    const payload = {
      name: leadName.trim(),
      email: leadEmail.trim(),
      phone: leadPhone.trim(),
      title: leadTitle.trim(),
      product: leadProduct,
      stage: leadStage,
      source: leadSource,
      value: leadValue ? `$${leadValue}` : '$0',
      followups: leadFollowups
    };

    const isUpdate = leadMode === 'update';
    const request = isUpdate
      ? put(`/api/leads/${matchingLeadId}`, payload)
      : post('/api/leads', payload);

    request.then(data => {
      if (data.success) {
        setConvertModalOpen(false);
        setToastMessage(`Successfully ${isUpdate ? 'updated' : 'converted'} ${leadName} ${isUpdate ? 'details' : 'to a Lead'}!`);
        setShowToast(true);
        fetchLeads();
        setTimeout(() => setShowToast(false), 4000);
      } else {
        alert(`Failed to ${isUpdate ? 'update' : 'convert'} lead: ` + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error(`Error ${isUpdate ? 'updating' : 'converting'} lead:`, err);
      alert('Could not reach backend to save lead.');
    });
  };

  const handleSaveContactDetails = () => {
    if (!activeChat || currentChat.id === 'placeholder') return;

    put('/api/conversations/' + currentChat._id, {
      name: editName,
      phone: editPhone,
      email: editEmail,
      notes: editNotes
    })
    .then(data => {
      if (data.success) {
        setIsEditing(false);
        fetchMessages();
      } else {
        alert('Failed to save contact details: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error('Error saving contact details:', err);
      alert('Could not reach backend server to save contact details.');
    });
  };

  const handleUnpickChat = () => {
    if (!activeChat || currentChat.id === 'placeholder') return;
    setUnpickReason('');
    setUnpickModalOpen(true);
  };

  const confirmUnpickChat = () => {
    if (!activeChat || currentChat.id === 'placeholder' || !unpickReason.trim()) return;

    const bodyPayload = {
      platform: currentChat.platform,
      participantId: activeChat,
      agent: null,
      status: 'New',
      unpickBy: user?.name || 'Majharul Islam Sifat',
      unpickReason: unpickReason.trim()
    };

    put('/api/conversations/' + currentChat._id, bodyPayload)
    .then(data => {
      if (data.success) {
        setUnpickModalOpen(false);
        setUnpickReason('');
        setActiveChat(null);
        fetchMessages();
      } else {
        alert('Failed to unpick ticket: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error('Error unpicking ticket:', err);
      alert('Could not reach backend server to unpick ticket.');
    });
  };

  const handleDeleteChat = () => {
    if (!activeChat || currentChat.id === 'placeholder') return;

    const confirmMsg = `Are you sure you want to permanently delete ticket #${currentChat.id || ''} (${currentChat.name}) and all its messages? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    del('/api/conversations/' + currentChat._id)
    .then(data => {
      if (data.success) {
        setActiveChat(null);
        fetchMessages();
      } else {
        alert('Failed to delete ticket: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error('Error deleting ticket:', err);
      alert('Could not reach backend server to delete ticket.');
    });
  };

  // Quick reply template handlers
  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (!templateTitle.trim() || !templateText.trim()) return;

    if (editingTemplateId) {
      setTemplates(prev => prev.map(t => t.id === editingTemplateId ? { ...t, title: templateTitle.trim(), text: templateText.trim() } : t));
      setEditingTemplateId(null);
    } else {
      const newTpl = {
        id: Date.now().toString(),
        title: templateTitle.trim(),
        text: templateText.trim()
      };
      setTemplates(prev => [...prev, newTpl]);
    }
    setTemplateTitle('');
    setTemplateText('');
    setIsAddingTemplate(false);
  };

  const handleSelectTemplate = (text) => {
    setMessageText(text);
    setShowTemplates(false);
  };

  // Fetch from backend
  const fetchMessages = () => {
    get('/api/messages')
      .then(data => {
        if (data.success) {
          const formattedChats = data.conversations
            .filter(c => c.agent === user?.name)
            .map(c => ({
              id: c.participantId,
              _id: c._id,
              name: c.participantName,
              pictureUrl: c.pictureUrl || '',
              platform: c.platform,
              lastMsg: c.lastMessage,
              time: new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: c.unreadCount,
              phone: c.phone || (c.platform === 'whatsapp' ? '+' + c.participantId : 'N/A'),
              email: c.email || 'N/A',
              notes: c.notes || '',
              agent: c.agent,
              unpickHistory: c.unpickHistory || []
            }));
          setChats(formattedChats);

          let newActiveChat = activeChat;
          const savedActiveChatId = localStorage.getItem('crm_active_chat_id');
          if (savedActiveChatId && formattedChats.some(c => c.id === savedActiveChatId)) {
            newActiveChat = savedActiveChatId;
            localStorage.removeItem('crm_active_chat_id');
          } else {
            const exists = formattedChats.some(c => c.id === activeChat);
            if (!exists) {
              newActiveChat = formattedChats.length > 0 ? formattedChats[0].id : null;
            }
          }
          setActiveChat(newActiveChat);

          setAllMessages(data.messages.map(m => {
            const isAgent = m.senderId === facebookPageId || m.senderId === whatsappPhone || m.senderId === 'my_page' || m.senderId === 'my_whatsapp';
            return {
              id: m._id,
              chatId: isAgent ? m.recipientId : m.senderId,
              sender: isAgent ? 'agent' : 'client',
              text: m.text,
              time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          }));
        }
      })
      .catch(err => console.error('Error fetching messages:', err));
  };

  const facebookPageId = metaConnections?.facebookPageId;
  const whatsappPhone = metaConnections?.whatsappPhone;

  // Poll every 15 seconds
  useEffect(() => {
    fetchMessages();
    fetchLeads();
    const interval = setInterval(() => {
      fetchMessages();
      fetchLeads();
    }, 15000);
    return () => clearInterval(interval);
  }, [facebookPageId, whatsappPhone]);

  useEffect(() => {
    setIsEditing(false);
  }, [activeChat]);

  useEffect(() => {
    if (isEditing) return;
    const current = chats.find(c => c.id === activeChat);
    if (current) {
      setEditName(current.name || '');
      setEditPhone(current.phone === 'N/A' ? '' : (current.phone || ''));
      setEditEmail(current.email === 'N/A' ? '' : (current.email || ''));
      setEditNotes(current.notes || '');
    }
  }, [activeChat, chats, isEditing]);

  // Reset unread count for active conversation when selected
  useEffect(() => {
    if (!activeChat || !chats.length) return;
    const targetChat = chats.find(c => c.id === activeChat);
    if (!targetChat || targetChat.unread === 0) return;

    post('/api/conversations/read', {
      platform: targetChat.platform,
      participantId: activeChat
    })
    .then(data => {
      if (data.success) {
        setChats(prev => prev.map(c => c.id === activeChat ? { ...c, unread: 0 } : c));
      }
    })
    .catch(err => console.error('Error marking conversation as read:', err));
  }, [activeChat, chats]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeChat || currentChat.id === 'placeholder') return;

    const textToSend = messageText;
    setMessageText('');

    setAllMessages(prev => [
      ...prev,
      { id: Date.now().toString(), chatId: activeChat, sender: 'agent', text: textToSend, time: 'Sending...' }
    ]);

    post('/api/messages/send', {
      platform: currentChat.platform,
      recipientId: activeChat,
      text: textToSend
    })
    .then(data => {
      if (data.success) {
        fetchMessages();
      } else {
        alert('Failed to send message: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error('Error sending message:', err);
      alert('Could not reach backend server to send message.');
    });
  };

  const messages = allMessages.filter(m => m.chatId === activeChat) || [];

  const currentChat = chats.find(c => c.id === activeChat) || {
    id: 'placeholder', name: 'No Conversations', platform: 'facebook', lastMsg: '', time: '', unread: 0, phone: '', email: '', notes: '', pictureUrl: ''
  };

  const matchingLead = leads.find(l => {
    if (!currentChat || currentChat.id === 'placeholder') return false;
    const normalizePhone = (num) => num ? num.replace(/[^\d]/g, '') : '';

    const leadPhoneNorm = normalizePhone(l.phone);
    const chatPhoneNorm = normalizePhone(currentChat.phone);
    const phoneMatch = leadPhoneNorm && chatPhoneNorm && leadPhoneNorm === chatPhoneNorm;

    const leadEmailNorm = l.email ? l.email.trim().toLowerCase() : '';
    const chatEmailNorm = currentChat.email ? currentChat.email.trim().toLowerCase() : '';
    const emailMatch = leadEmailNorm && chatEmailNorm && leadEmailNorm === chatEmailNorm;

    const leadNameNorm = l.name ? l.name.trim().toLowerCase() : '';
    const chatNameNorm = currentChat.name ? currentChat.name.trim().toLowerCase() : '';
    const nameMatch = leadNameNorm && chatNameNorm && leadNameNorm === chatNameNorm;

    return phoneMatch || emailMatch || nameMatch;
  });

  return (
    <div className="h-[calc(100vh-8.5rem)] flex rounded-xl border border-slate-800/80 bg-slate-950/40 overflow-hidden">

      <ConversationList
        chats={chats}
        activeChat={activeChat}
        onSelectChat={setActiveChat}
      />

      <div className="flex-1 flex flex-col">
        <MessageThread messages={messages} currentChat={currentChat} />

        <MessageInput
          onSendMessage={handleSendMessage}
          onSelectTemplate={handleSelectTemplate}
          messageText={messageText}
          onMessageTextChange={setMessageText}
          templates={templates}
          setTemplates={setTemplates}
          showTemplates={showTemplates}
          setShowTemplates={setShowTemplates}
          isAddingTemplate={isAddingTemplate}
          setIsAddingTemplate={setIsAddingTemplate}
          activeChat={activeChat}
          currentChat={currentChat}
        />
      </div>

      {/* Customer Sidebar Details */}
      <div className="w-80 border-l border-slate-800 p-6 hidden xl:block bg-slate-900/20 overflow-y-auto">
        {currentChat.id === 'placeholder' ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Select a chat to view details.
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex border-b border-slate-800/80 mb-6 flex-shrink-0">
              <button
                onClick={() => setRightSidebarTab('info')}
                className={`flex-1 pb-3 text-[11px] font-semibold border-b-2 transition-all ${
                  rightSidebarTab === 'info'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Contact Info
              </button>
              <button
                onClick={() => setRightSidebarTab('templates')}
                className={`flex-1 pb-3 text-[11px] font-semibold border-b-2 transition-all ${
                  rightSidebarTab === 'templates'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Templates ({templates.length})
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {rightSidebarTab === 'info' ? (
                isEditing ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      {currentChat.pictureUrl ? (
                        <img
                          src={currentChat.pictureUrl}
                          alt={editName}
                          className="w-16 h-16 rounded-full object-cover border border-indigo-500/30 mx-auto"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-indigo-600/15 border border-indigo-500/30 mx-auto flex items-center justify-center font-bold text-lg text-indigo-400">
                          {(editName && editName.charAt(0)) || '?'}
                        </div>
                      )}
                      <h4 className="text-xs font-semibold text-slate-400 mt-3">Edit Profile</h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-slate-500 block uppercase font-semibold mb-1">Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                          placeholder="Enter name"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block uppercase font-semibold mb-1">Phone</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                          className="w-full bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block uppercase font-semibold mb-1">Email</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={e => setEditEmail(e.target.value)}
                          className="w-full bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block uppercase font-semibold mb-1">Additional Info</label>
                        <textarea
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          rows={4}
                          className="w-full bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 resize-none"
                          placeholder="Add additional notes here..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveContactDetails}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-600/15"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-400 rounded-lg text-xs font-semibold transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 flex flex-col h-full justify-between">
                    <div className="space-y-6">
                      <div className="text-center">
                        {currentChat.pictureUrl ? (
                          <img
                            src={currentChat.pictureUrl}
                            alt={currentChat.name}
                            className="w-16 h-16 rounded-full object-cover border border-slate-800 mx-auto"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto flex items-center justify-center font-bold text-lg text-slate-300">
                            {(currentChat.name && currentChat.name.charAt(0)) || '?'}
                          </div>
                        )}
                        <h4 className="text-sm font-bold text-slate-200 mt-3">{currentChat.name}</h4>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-medium border border-indigo-500/20 mt-1 inline-block">
                          Prospecting
                        </span>
                      </div>

                      <div className="border-t border-slate-800/60 pt-6 space-y-4">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Phone</span>
                          <span className="text-xs text-slate-300 font-medium">{currentChat.phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Email</span>
                          <span className="text-xs text-slate-300 font-medium">{currentChat.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Integration Source</span>
                          <span className="text-xs text-slate-300 font-medium capitalize">{currentChat.platform}</span>
                        </div>
                        {currentChat.notes && (
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Additional Info</span>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed bg-slate-900/30 p-2 rounded border border-slate-800/40 whitespace-pre-line mt-1">
                              {currentChat.notes}
                            </p>
                          </div>
                        )}
                        {currentChat.unpickHistory && currentChat.unpickHistory.length > 0 && (
                          <div className="mt-4">
                            <span className="text-[10px] text-amber-500 block uppercase font-semibold">Unpick History</span>
                            <div className="mt-1.5 bg-slate-900/30 p-2 rounded border border-slate-800/40 space-y-2.5 max-h-36 overflow-y-auto">
                              {currentChat.unpickHistory.map((history, idx) => (
                                <div key={idx} className="flex flex-col text-[10px] text-slate-400 border-b border-slate-800/20 pb-2 last:border-0 last:pb-0">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-300 truncate max-w-[120px]">{history.agent}</span>
                                    <span className="text-[9px] text-slate-500">{new Date(history.timestamp).toLocaleString()}</span>
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
                    </div>

                    <div className="space-y-2 border-t border-slate-800/60 pt-6">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-all mb-1"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={handleOpenConvertModal}
                        className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-semibold transition-all"
                      >
                        {matchingLead ? 'Update Lead' : 'Convert to Lead'}
                      </button>
                      <button
                        onClick={handleUnpickChat}
                        className="w-full py-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold transition-all"
                      >
                        Unpick Ticket
                      </button>
                      <button
                        onClick={handleDeleteChat}
                        className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold transition-all"
                      >
                        Delete Ticket (Remove)
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-4 h-full flex flex-col">
                  {(isAddingTemplate || editingTemplateId) ? (
                    <form onSubmit={handleSaveTemplate} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3 flex-shrink-0">
                      <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">
                        {editingTemplateId ? 'Edit Template' : 'Create Template'}
                      </h4>
                      <div>
                        <label className="text-[9px] text-slate-500 block uppercase font-semibold mb-1">Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Greeting"
                          value={templateTitle}
                          onChange={e => setTemplateTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block uppercase font-semibold mb-1">Content</label>
                        <textarea
                          placeholder="Type template message..."
                          value={templateText}
                          onChange={e => setTemplateText(e.target.value)}
                          rows={4}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 resize-none focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingTemplate(false);
                            setEditingTemplateId(null);
                            setTemplateTitle('');
                            setTemplateText('');
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded text-[10px] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] transition-colors font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setIsAddingTemplate(true);
                        setEditingTemplateId(null);
                        setTemplateTitle('');
                        setTemplateText('');
                      }}
                      className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
                    >
                      <Plus size={14} /> Add Template
                    </button>
                  )}

                  <div className="relative flex-shrink-0">
                    <Search className="absolute left-2.5 top-2 text-slate-500" size={14} />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={templateSearchQuery}
                      onChange={e => setTemplateSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-[11px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {templates.filter(t =>
                      t.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                      t.text.toLowerCase().includes(templateSearchQuery.toLowerCase())
                    ).map(tpl => (
                      <div
                        key={tpl.id}
                        className="p-3 bg-slate-900/40 border border-slate-800/40 rounded-xl hover:border-indigo-500/30 transition-all group flex flex-col gap-2"
                      >
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">{tpl.title}</h5>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-3 leading-relaxed whitespace-pre-line">{tpl.text}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-800/30 pt-2 mt-1">
                          <button
                            type="button"
                            onClick={() => handleSelectTemplate(tpl.text)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Send size={10} /> Use Template
                          </button>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTemplateId(tpl.id);
                                setIsAddingTemplate(false);
                                setTemplateTitle(tpl.title);
                                setTemplateText(tpl.text);
                              }}
                              className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                              title="Edit template"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTemplates(prev => prev.filter(t => t.id !== tpl.id));
                              }}
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                              title="Delete template"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {templates.filter(t =>
                      t.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                      t.text.toLowerCase().includes(templateSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-[11px]">
                        No templates found.
                      </div>
                    )}
                  </div>
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
                }}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnpickChat}
                disabled={!unpickReason.trim()}
                className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/20 hover:border-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600/20 disabled:hover:text-amber-400 disabled:hover:border-amber-500/20 rounded-xl text-xs font-bold transition-all"
              >
                Confirm Unpick
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert/Update Lead Modal */}
      {convertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[480px] bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus size={16} className="text-indigo-400" /> {leadMode === 'update' ? 'Update Lead' : 'Convert to Lead'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {leadMode === 'update' ? "Update this lead's sales funnel and follow up information." : 'Add this contact to your active sales funnel leads list.'}
              </p>
            </div>

            <form onSubmit={handleConvertLeadSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Profile / Name</label>
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="e.g. +88017..."
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Lead Title / Inquiry</label>
                <input
                  type="text"
                  value={leadTitle}
                  onChange={(e) => setLeadTitle(e.target.value)}
                  placeholder="e.g. Shirt order, custom design inquiry..."
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Product</label>
                  <select
                    value={leadProduct}
                    onChange={(e) => setLeadProduct(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60"
                  >
                    {PRODUCTS.map(prod => <option key={prod} value={prod}>{prod}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Stage</label>
                  <select
                    value={leadStage}
                    onChange={(e) => setLeadStage(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60"
                  >
                    <option value="Intake">Intake (ইনটেক)</option>
                    <option value="Interested">Interested (ইন্টারেস্টেড)</option>
                    <option value="Qualified">Qualify (কোয়ালিফাই)</option>
                    <option value="Converted">Convert (কনভার্ট)</option>
                    <option value="Lost">Lost (লস্ট)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Source</label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Calling">Calling</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Estimated Value ($)</label>
                  <input
                    type="number"
                    value={leadValue}
                    onChange={(e) => setLeadValue(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Scheduled Follow Ups</span>
                  <button
                    type="button"
                    onClick={() => setHasFollowUp(!hasFollowUp)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Follow Up
                  </button>
                </div>

                {leadFollowups.length > 0 && (
                  <div className="space-y-2 mb-3 max-h-32 overflow-y-auto pr-1">
                    {leadFollowups.map((f, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-950/60 border border-slate-800/60 p-2.5 rounded-xl text-[11px] text-slate-300 font-medium">
                        <div>
                          <p className="font-semibold text-slate-200">{f.title}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">
                            Agent: {f.agent} • Due: {new Date(f.dueDateTime).toLocaleString()}
                            {f.notified && <span className="ml-1.5 text-emerald-500 font-bold">(Notified)</span>}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLeadFollowups(prev => prev.filter((_, i) => i !== index))}
                          className="text-[10px] text-rose-500 hover:text-rose-400 font-semibold px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {hasFollowUp && (
                  <div className="bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-xl space-y-3 mt-2">
                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">New Follow Up</h4>
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">Follow Up Title</label>
                      <input
                        type="text"
                        value={newFollowUpTitle}
                        onChange={e => setNewFollowUpTitle(e.target.value)}
                        placeholder="e.g. Call client for negotiation"
                        className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">Assign Agent</label>
                        <select
                          value={newFollowUpAgent}
                          onChange={e => setNewFollowUpAgent(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Majharul_Islam_Sifat">Majharul_Islam_Sifat</option>
                          <option value="Support Member A">Support Member A</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">Due Date & Time</label>
                        <input
                          type="datetime-local"
                          value={newFollowUpDate}
                          onChange={e => setNewFollowUpDate(e.target.value)}
                          onClick={(e) => {
                            try {
                              e.target.showPicker();
                            } catch (err) {
                              console.warn("showPicker is not supported in this browser:", err);
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setHasFollowUp(false);
                          setNewFollowUpTitle('');
                          setNewFollowUpDate('');
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded text-[10px] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newFollowUpTitle.trim() || !newFollowUpDate) {
                            alert('Follow-up Title and Date/Time are required');
                            return;
                          }
                          const f = {
                            title: newFollowUpTitle.trim(),
                            agent: newFollowUpAgent,
                            dueDateTime: new Date(newFollowUpDate).toISOString(),
                            notified: false
                          };
                          setLeadFollowups(prev => [...prev, f]);
                          setHasFollowUp(false);
                          setNewFollowUpTitle('');
                          setNewFollowUpDate('');
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] transition-colors font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setConvertModalOpen(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/10"
                >
                  {leadMode === 'update' ? 'Update Lead' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-indigo-500/30 text-indigo-400 px-4 py-3.5 rounded-xl text-xs font-semibold shadow-2xl shadow-indigo-950/20 flex items-center gap-3 z-50 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
