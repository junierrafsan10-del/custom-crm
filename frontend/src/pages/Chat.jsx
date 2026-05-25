import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { get, post, put, del } from '../utils/api';
import ConversationList from '../components/chat/ConversationList';
import MessageThread from '../components/chat/MessageThread';
import MessageInput from '../components/chat/MessageInput';
import ConversationDetail from '../components/chat/ConversationDetail';

const UnpickModal = lazy(() => import('../components/chat/UnpickModal'));
const ConvertLeadModal = lazy(() => import('../components/chat/ConvertLeadModal'));

function ModalFallback() {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-outline-variant/30 border-t-primary animate-spin" />
    </div>
  );
}

export default function Chat({ metaConnections, user }) {
  const [activeChat, setActiveChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [chats, setChats] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('crm_reply_templates');
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    return [
      { id: '1', title: 'Greeting', text: 'Hi! Thank you for reaching out to us. How can we help you today?' },
      { id: '2', title: 'Pricing Info', text: 'Our standard pricing package details are available here. We have a basic tier starting at $29/mo.' },
      { id: '3', title: 'Discount Offer', text: 'We are currently offering a special 15% discount for first-time customers! Use code WELCOME15.' },
      { id: '4', title: 'Support Issue', text: 'I have forwarded this ticket to our technical support team. We will get back to you within 2 hours.' },
      { id: '5', title: 'Thank You', text: 'Thank you for choosing our service. Have a wonderful day!' }
    ];
  });
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [leads, setLeads] = useState([]);
  const [unpickModalOpen, setUnpickModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  useEffect(() => { localStorage.setItem('crm_reply_templates', JSON.stringify(templates)); }, [templates]);

  const triggerToast = (msg) => { setToastMessage(msg); setShowToast(true); setTimeout(() => setShowToast(false), 4000); };

  const fetchLeads = useCallback(() => {
    get('/api/leads').then(data => { if (data.success && data.data) setLeads(data.data); }).catch(err => console.error('Error fetching leads:', err));
  }, []);

  const fetchMessages = useCallback(() => {
    get('/api/messages').then(data => {
      if (!data.success) return;
      const formattedChats = data.conversations
        .filter(c => c.agent === user?.name)
        .map(c => ({
          id: c.participantId, _id: c._id, name: c.participantName,
          pictureUrl: c.pictureUrl || '', platform: c.platform,
          lastMsg: c.lastMessage, time: new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: c.unreadCount, phone: c.phone || (c.platform === 'whatsapp' ? '+' + c.participantId : 'N/A'),
          email: c.email || 'N/A', notes: c.notes || '', agent: c.agent, unpickHistory: c.unpickHistory || []
        }));
      setChats(formattedChats);

      const savedActiveChatId = localStorage.getItem('crm_active_chat_id');
      if (savedActiveChatId && formattedChats.some(c => c.id === savedActiveChatId)) {
        setActiveChat(savedActiveChatId);
        localStorage.removeItem('crm_active_chat_id');
      }
    }).catch(err => console.error('Error fetching messages:', err));

    get('/api/messages').then(data => {
      if (!data.success) return;
      setAllMessages(data.messages.map(m => {
        const isAgent = m.senderId === metaConnections?.facebookPageId || m.senderId === metaConnections?.whatsappPhone || m.senderId === 'my_page' || m.senderId === 'my_whatsapp';
        return { id: m._id, chatId: isAgent ? m.recipientId : m.senderId, sender: isAgent ? 'agent' : 'client', text: m.text, time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      }));
    }).catch(err => console.error('Error fetching messages:', err));
  }, [user?.name, metaConnections?.facebookPageId, metaConnections?.whatsappPhone]);

  useEffect(() => {
    fetchMessages(); fetchLeads();
    let interval = setInterval(() => { fetchMessages(); fetchLeads(); }, 15000);
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchMessages(); fetchLeads();
        interval = setInterval(() => { fetchMessages(); fetchLeads(); }, 15000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchMessages, fetchLeads]);

  useEffect(() => {
    if (!activeChat || !chats.length) return;
    const targetChat = chats.find(c => c.id === activeChat);
    if (!targetChat || targetChat.unread === 0) return;
    post('/api/conversations/read', { platform: targetChat.platform, participantId: activeChat })
      .then(data => { if (data.success) setChats(prev => prev.map(c => c.id === activeChat ? { ...c, unread: 0 } : c)); })
      .catch(err => console.error('Error marking conversation as read:', err));
  }, [activeChat, chats]);

  const handleSelectTemplate = (text) => { setMessageText(text); setShowTemplates(false); };

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeChat || currentChat.id === 'placeholder') return;
    const textToSend = messageText; setMessageText('');
    setAllMessages(prev => [...prev, { id: Date.now().toString(), chatId: activeChat, sender: 'agent', text: textToSend, time: 'Sending...' }]);
    post('/api/messages/send', { platform: currentChat.platform, recipientId: activeChat, text: textToSend })
      .then(data => { if (data.success) fetchMessages(); else alert('Failed to send message: ' + (data.error || 'Unknown error')); })
      .catch(err => { console.error('Error sending message:', err); alert('Could not reach backend server to send message.'); });
  };

  const handleDeleteChat = () => {
    if (!activeChat || currentChat.id === 'placeholder') return;
    if (!window.confirm(`Are you sure you want to permanently delete ticket #${currentChat.id || ''} (${currentChat.name}) and all its messages? This action cannot be undone.`)) return;
    del('/api/conversations/' + currentChat._id)
      .then(data => { if (data.success) { setActiveChat(null); fetchMessages(); } else alert('Failed to delete ticket: ' + (data.error || 'Unknown error')); })
      .catch(err => { console.error('Error deleting ticket:', err); alert('Could not reach backend server to delete ticket.'); });
  };

  const handleUnpickChat = () => {
    if (!activeChat || currentChat.id === 'placeholder') return;
    setUnpickModalOpen(true);
  };

  const confirmUnpickChat = (reason) => {
    if (!activeChat || currentChat.id === 'placeholder' || !reason.trim()) return;
    put('/api/conversations/' + currentChat._id, {
      platform: currentChat.platform, participantId: activeChat,
      agent: null, status: 'New', unpickBy: user?.name || 'Majharul Islam Sifat', unpickReason: reason.trim()
    }).then(data => {
      if (data.success) { setUnpickModalOpen(false); setActiveChat(null); fetchMessages(); }
      else alert('Failed to unpick ticket: ' + (data.error || 'Unknown error'));
    }).catch(err => { console.error('Error unpicking ticket:', err); alert('Could not reach backend server to unpick ticket.'); });
  };

  const messages = useMemo(() => allMessages.filter(m => m.chatId === activeChat) || [], [allMessages, activeChat]);
  const currentChat = useMemo(() => chats.find(c => c.id === activeChat) || {
    id: 'placeholder', name: 'No Conversations', platform: 'facebook', lastMsg: '', time: '', unread: 0, phone: '', email: '', notes: '', pictureUrl: ''
  }, [chats, activeChat]);

  const matchingLead = useMemo(() => leads.find(l => {
    if (!currentChat || currentChat.id === 'placeholder') return false;
    const normalizePhone = (num) => num ? num.replace(/[^\d]/g, '') : '';
    const lpn = normalizePhone(l.phone), cpn = normalizePhone(currentChat.phone);
    const phoneMatch = lpn && cpn && lpn === cpn;
    const emailMatch = (l.email?.trim().toLowerCase() || '') && (currentChat.email?.trim().toLowerCase() || '') && l.email.trim().toLowerCase() === currentChat.email.trim().toLowerCase();
    const nameMatch = (l.name?.trim().toLowerCase() || '') && (currentChat.name?.trim().toLowerCase() || '') && l.name.trim().toLowerCase() === currentChat.name.trim().toLowerCase();
    return phoneMatch || emailMatch || nameMatch;
  }), [leads, currentChat]);

  const handleRefresh = () => { fetchMessages(); fetchLeads(); };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex rounded-xl border border-slate-800/80 bg-slate-950/40 overflow-hidden">
      <ConversationList chats={chats} activeChat={activeChat} onSelectChat={setActiveChat} />

      <div className="flex-1 flex flex-col">
        <MessageThread messages={messages} currentChat={currentChat} />
        <MessageInput onSendMessage={handleSendMessage} onSelectTemplate={handleSelectTemplate} messageText={messageText} onMessageTextChange={setMessageText} templates={templates} setTemplates={setTemplates} showTemplates={showTemplates} setShowTemplates={setShowTemplates} isAddingTemplate={isAddingTemplate} setIsAddingTemplate={setIsAddingTemplate} activeChat={activeChat} currentChat={currentChat} />
      </div>

      <ConversationDetail currentChat={currentChat} activeChat={activeChat} matchingLead={matchingLead} templates={templates} setTemplates={setTemplates} isAddingTemplate={isAddingTemplate} setIsAddingTemplate={setIsAddingTemplate} handleSelectTemplate={handleSelectTemplate} onRefresh={handleRefresh} onToast={triggerToast} onConvertLead={() => setConvertModalOpen(true)} onUnpickChat={handleUnpickChat} onDeleteChat={handleDeleteChat} />

      <Suspense fallback={null}>
        {unpickModalOpen && <UnpickModal isOpen={unpickModalOpen} onConfirm={confirmUnpickChat} onCancel={() => setUnpickModalOpen(false)} />}
      </Suspense>

      <Suspense fallback={null}>
        {convertModalOpen && <ConvertLeadModal isOpen={convertModalOpen} onClose={() => setConvertModalOpen(false)} currentChat={currentChat} matchingLead={matchingLead} onRefresh={handleRefresh} onToast={triggerToast} />}
      </Suspense>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-indigo-500/30 text-indigo-400 px-4 py-3.5 rounded-xl text-xs font-semibold shadow-2xl shadow-indigo-950/20 flex items-center gap-3 z-50 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
