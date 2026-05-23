import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { get, post } from '../utils/api';
import { 
  Bell, 
  MessageSquare, 
  Phone, 
  Settings, 
  Search,
  Wifi,
  WifiOff,
  User
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

export default function Topbar({ user, metaConnections }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Map page paths to human readable titles
  const titleMap = {
    '/': 'Home Dashboard',
    '/chat': 'Inbox & Meta Conversations',
    '/dialer': 'Call Dialer',
    '/leads': 'Lead Database',
    '/tasks': 'Task Management',
    '/members': 'Members',
    '/users': 'Users',
    '/settings': 'System Configuration',
  };

  const currentTitle = titleMap[location.pathname] || 'Dashboard';

  const [chats, setChats] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatDropdownOpen, setChatDropdownOpen] = useState(false);
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState('All');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const getChats = () => {
      get('/api/messages')
        .then(data => {
          if (data.success && data.conversations) {
            const myChats = data.conversations.filter(c => c.agent === user?.name || !c.agent);
            setChats(myChats);
            const totalUnread = myChats.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
            setUnreadCount(totalUnread);
          }
        })
        .catch(err => console.error('Error fetching Topbar chats:', err));
    };
    getChats();
    const interval = setInterval(getChats, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const getNotifications = () => {
      get('/api/notifications')
        .then(data => {
          if (data.success && data.data) {
            setNotifications(data.data);
          }
        })
        .catch(err => console.error('Error fetching Topbar notifications:', err));
    };
    getNotifications();
    const interval = setInterval(getNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.topbar-dropdown-trigger') && !e.target.closest('.topbar-dropdown-menu')) {
        setChatDropdownOpen(false);
        setBellDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleChatClick = (chatId) => {
    localStorage.setItem('crm_active_chat_id', chatId);
    navigate('/chat');
    setChatDropdownOpen(false);
  };

  const handleNotificationClick = (notif) => {
    const notifId = notif._id || notif.id;
    post('/api/notifications/mark-read', { ids: [notifId] })
      .then(res => res.json())
      .then(() => {
        setNotifications(prev => prev.map(n => {
          const id = n._id || n.id;
          return id === notifId ? { ...n, unread: false } : n;
        }));
      })
      .catch(err => console.error('Error marking notification read:', err));

    if (notif.targetTab) {
      navigate('/' + notif.targetTab);
    }
    setBellDropdownOpen(false);
  };

  const handleMarkAllNotificationsRead = () => {
    post('/api/notifications/mark-read', {})
      .then(res => res.json())
      .then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      })
      .catch(err => console.error('Error marking all notifications read:', err));
  };

  const unreadNotifsCount = notifications.filter(n => n.unread).length;

  // Dynamic server status from Meta OAuth connection state
  const services = [
    { name: 'Facebook Graph API', connected: metaConnections?.facebookConnected || false, icon: Facebook, color: 'text-blue-500' },
    { name: 'WhatsApp Business API', connected: metaConnections?.whatsappConnected || false, icon: MessageSquare, color: 'text-emerald-500' },
    { name: 'Call SIP Server', connected: true, icon: Phone, color: 'text-indigo-500' }
  ];

  return (
    <header className="h-16 fixed top-0 right-0 z-30 bg-slate-950/70 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 transition-all duration-300" style={{ left: 'inherit', width: 'calc(100% - var(--sidebar-width, 80px))' }}>
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">{currentTitle}</h1>
      </div>

      {/* Action / Status Center */}
      <div className="flex items-center gap-6">
        
        {/* Connection Statuses */}
        <div className="hidden md:flex items-center gap-3 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div 
                key={index} 
                className="flex items-center gap-1.5 relative group cursor-pointer"
                title={service.name}
              >
                <div className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors">
                  <Icon size={14} className={service.color} />
                </div>
                <span className={`w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 border border-slate-950 ${
                  service.connected ? 'bg-emerald-500' : 'bg-red-500'
                }`} />
                
                {/* Tooltip */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] text-slate-200 px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {service.name}: {service.connected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Notifications & Action Badges */}
        <div className="flex items-center gap-3">
          {/* Chat Notifications */}
          <div className="relative topbar-dropdown-trigger">
            <button 
              onClick={() => {
                setChatDropdownOpen(!chatDropdownOpen);
                setBellDropdownOpen(false);
              }}
              className={`p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 relative transition-colors ${chatDropdownOpen ? 'bg-slate-800 text-indigo-400' : ''}`}
            >
              <MessageSquare size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-slate-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {chatDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-80 bg-slate-950/95 border border-slate-800/80 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden z-50 topbar-dropdown-menu">
                <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/10 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-200">Recent Chats</h4>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} Unread
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/30">
                  {chats.length > 0 ? (
                    chats.map((chat) => (
                      <div 
                        key={chat.participantId} 
                        onClick={() => handleChatClick(chat.participantId)}
                        className={`p-3 hover:bg-slate-850/40 cursor-pointer flex gap-3 items-center transition-colors ${chat.unreadCount > 0 ? 'bg-indigo-600/5' : ''}`}
                      >
                        <div className="relative flex-shrink-0">
                          {chat.pictureUrl ? (
                            <img 
                              src={chat.pictureUrl} 
                              alt={chat.participantName} 
                              className="w-8 h-8 rounded-full object-cover border border-slate-800" 
                              referrerPolicy="no-referrer" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                              {chat.participantName ? chat.participantName.charAt(0) : '?'}
                            </div>
                          )}
                          <span className={`w-2 h-2 rounded-full absolute bottom-0 right-0 border border-slate-950 ${chat.platform === 'facebook' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'font-bold text-slate-100' : 'text-slate-300'}`}>{chat.participantName}</p>
                            {chat.unreadCount > 0 && (
                              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 ml-1.5" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{chat.lastMessage || 'No messages'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No active conversations.
                    </div>
                  )}
                </div>
                <div className="p-2.5 border-t border-slate-800/80 text-center bg-slate-900/10">
                  <button 
                    onClick={() => {
                      navigate('/chat');
                      setChatDropdownOpen(false);
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                  >
                    View All Chats
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Alarm/Bell Notifications */}
          <div className="relative topbar-dropdown-trigger">
            <button 
              onClick={() => {
                setBellDropdownOpen(!bellDropdownOpen);
                setChatDropdownOpen(false);
              }}
              className={`p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 relative transition-colors ${bellDropdownOpen ? 'bg-slate-800 text-indigo-400' : ''}`}
            >
              <Bell size={18} />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-slate-950">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {bellDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-96 bg-slate-950/95 border border-slate-800/80 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden z-50 topbar-dropdown-menu flex flex-col">
                {/* Header */}
                <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/10 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-200">Notifications</h4>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                    {unreadNotifsCount} New
                  </span>
                </div>

                {/* Category Filtering Tabs */}
                <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-905/30">
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-semibold text-slate-400">
                    {['All', 'Unread', 'Lead', 'Ticket', 'Opportunity', 'Task', 'Comment'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveNotifTab(cat);
                        }}
                        className={`pb-1 transition-all relative ${
                          activeNotifTab === cat 
                            ? 'text-indigo-400 font-bold' 
                            : 'hover:text-slate-200'
                        }`}
                      >
                        {cat}
                        {activeNotifTab === cat && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full animate-in fade-in zoom-in-50 duration-150" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/30">
                  {notifications.filter(n => {
                    if (activeNotifTab === 'All') return true;
                    if (activeNotifTab === 'Unread') return n.unread;
                    return n.type.toLowerCase() === activeNotifTab.toLowerCase();
                  }).length > 0 ? (
                    notifications.filter(n => {
                      if (activeNotifTab === 'All') return true;
                      if (activeNotifTab === 'Unread') return n.unread;
                      return n.type.toLowerCase() === activeNotifTab.toLowerCase();
                    }).map((notif) => (
                      <div 
                        key={notif._id || notif.id} 
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 hover:bg-slate-850/40 cursor-pointer flex gap-3 transition-colors ${notif.unread ? 'bg-indigo-600/5' : ''}`}
                      >
                        {/* Avatar container */}
                        <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-700/20">
                          <User size={13} />
                        </div>

                        {/* Content text */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-200">
                              {notif.unread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 animate-pulse" />}
                              <span>{notif.title}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 flex-shrink-0 font-medium mt-0.5">{notif.time}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            {notif.desc}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No notifications in this category.
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-2.5 border-t border-slate-800/80 bg-slate-900/10 flex justify-between items-center text-[10px] px-4">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('All notifications loaded.');
                    }}
                    className="text-slate-400 hover:text-slate-300 font-bold transition-colors"
                  >
                    Show More
                  </button>
                  {unreadNotifsCount > 0 && (
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAllNotificationsRead();
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Info & Avatar */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{user.name}</p>
            <p className="text-xs text-indigo-400 font-medium">{user.role}</p>
          </div>
          <div className="relative group cursor-pointer">
            <img 
              src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"} 
              alt={user.name} 
              className="w-9 h-9 rounded-full ring-2 ring-indigo-500/30 object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>
        </div>

      </div>
    </header>
  );
}
