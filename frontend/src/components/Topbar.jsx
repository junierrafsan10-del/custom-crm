import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { get, post } from '../utils/api';
import {
  Bell, MessageSquare, Phone, Search, Filter, ArrowUpDown,
} from 'lucide-react';

function FacebookIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const titleMap = {
  '/': 'Dashboard', '/chat': 'Inbox & Chat', '/dialer': 'Dialer',
  '/leads': 'Deals Pipeline', '/tasks': 'Tasks', '/members': 'Team Members',
  '/users': 'Users', '/settings': 'Settings',
};

export default function Topbar({ user, metaConnections }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTitle = titleMap[location.pathname] || 'Dashboard';

  const [chats, setChats] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatDropdownOpen, setChatDropdownOpen] = useState(false);
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const getChats = () => {
      get('/api/messages').then(data => {
        if (data.success && data.conversations) {
          const myChats = data.conversations.filter(c => c.agent === user?.name || !c.agent);
          setChats(myChats);
          setUnreadCount(myChats.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0));
        }
      }).catch(() => {});
    };
    getChats();
    const interval = setInterval(getChats, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const getNotifications = () => {
      get('/api/notifications').then(data => {
        if (data.success && data.data) setNotifications(data.data);
      }).catch(() => {});
    };
    getNotifications();
    const interval = setInterval(getNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setChatDropdownOpen(false);
        setBellDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChatClick = (chatId) => {
    localStorage.setItem('crm_active_chat_id', chatId);
    navigate('/chat');
    setChatDropdownOpen(false);
  };

  const handleNotificationClick = (notif) => {
    const notifId = notif._id || notif.id;
    post('/api/notifications/mark-read', { ids: [notifId] })
      .then(() => setNotifications(prev => prev.map(n => ((n._id || n.id) === notifId ? { ...n, unread: false } : n))))
      .catch(() => {});
    if (notif.targetTab) navigate('/' + notif.targetTab);
    setBellDropdownOpen(false);
  };

  const handleMarkAllRead = () => {
    post('/api/notifications/mark-read', {})
      .then(() => setNotifications(prev => prev.map(n => ({ ...n, unread: false }))))
      .catch(() => {});
  };

  const unreadNotifsCount = notifications.filter(n => n.unread).length;

  const services = [
    { name: 'Facebook Graph API', connected: metaConnections?.facebookConnected || false, icon: FacebookIcon, color: 'text-blue-500' },
    { name: 'WhatsApp Business API', connected: metaConnections?.whatsappConnected || false, icon: MessageSquare, color: 'text-emerald-500' },
    { name: 'Call SIP Server', connected: true, icon: Phone, color: 'text-primary' },
  ];

  const notifTabs = ['All', 'Unread'];
  const filteredNotifs = activeNotifTab === 'Unread' ? notifications.filter(n => n.unread) : notifications;

  return (
    <header className="bg-background/80 backdrop-blur-2xl sticky top-0 z-30 border-b border-outline-variant/10">
      <div className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 h-16 lg:h-20 gap-4">
        {/* Page title - visible on mobile */}
        <h1 className="text-sm font-bold text-on-surface truncate md:hidden">{currentTitle}</h1>

        {/* Search */}
        <div className="hidden sm:flex flex-1 max-w-md relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors z-10" size={16} />
          <input
            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-full py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
            placeholder="Search deals, contacts, or companies..."
            type="text"
          />
        </div>

        {/* Trailing */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto" ref={dropdownRef}>
          {/* Connection statuses */}
          <div className="hidden lg:flex items-center gap-1.5">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-low border border-outline-variant/10 group relative cursor-help" title={s.name}>
                  <Icon size={13} className={s.color} />
                  <span className={`w-1.5 h-1.5 rounded-full ${s.connected ? 'bg-primary' : 'bg-error'}`} />
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-surface-container-high text-[10px] text-on-surface px-2.5 py-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-outline-variant/10">
                    {s.name}: {s.connected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat */}
          <div className="relative">
            <button onClick={() => { setChatDropdownOpen(o => !o); setBellDropdownOpen(false); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant/60 hover:text-primary hover:bg-surface-container-high transition-all relative ${chatDropdownOpen ? 'text-primary bg-surface-container-high' : ''}`}
            >
              <MessageSquare size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] font-bold text-on-primary flex items-center justify-center border border-surface">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {chatDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-80 bg-surface-container-low/95 border border-outline-variant/10 rounded-xl shadow-2xl backdrop-blur-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-outline-variant/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface">Recent Chats</span>
                  <span className="text-[10px] text-on-surface-variant/60">{unreadCount} unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {chats.length > 0 ? chats.slice(0, 8).map(chat => (
                    <button key={chat._id} onClick={() => handleChatClick(chat.participantId)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-container-high transition-colors text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-semibold text-on-surface-variant flex-shrink-0">
                        {(chat.participantName || '?').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-on-surface truncate">{chat.participantName}</p>
                        <p className="text-[10px] text-on-surface-variant/60 truncate">{chat.lastMessage}</p>
                      </div>
                      {(chat.unreadCount || 0) > 0 && (
                        <span className="w-4 h-4 rounded-full bg-primary text-[8px] font-bold text-on-primary flex items-center justify-center flex-shrink-0">{chat.unreadCount}</span>
                      )}
                    </button>
                  )) : (
                    <div className="p-6 text-center text-xs text-on-surface-variant/50">No recent chats</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setBellDropdownOpen(o => !o); setChatDropdownOpen(false); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant/60 hover:text-primary hover:bg-surface-container-high transition-all relative ${bellDropdownOpen ? 'text-primary bg-surface-container-high' : ''}`}
            >
              <Bell size={18} />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] font-bold text-on-primary flex items-center justify-center border border-surface">
                  {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                </span>
              )}
            </button>
            {bellDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-80 bg-surface-container-low/95 border border-outline-variant/10 rounded-xl shadow-2xl backdrop-blur-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-outline-variant/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface">Notifications</span>
                  <button onClick={handleMarkAllRead} className="text-[10px] text-primary hover:text-primary-fixed font-semibold transition-colors cursor-pointer">Mark all read</button>
                </div>
                <div className="flex gap-1 px-3 pb-2 border-b border-outline-variant/10">
                  {notifTabs.map(tab => (
                    <button key={tab} onClick={() => setActiveNotifTab(tab)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${activeNotifTab === tab ? 'bg-primary/15 text-primary' : 'text-on-surface-variant/60 hover:text-on-surface-variant'}`}
                    >{tab}</button>
                  ))}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {filteredNotifs.length > 0 ? filteredNotifs.slice(0, 10).map(n => (
                    <button key={n._id || n.id} onClick={() => handleNotificationClick(n)}
                      className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-surface-container-high transition-colors text-left cursor-pointer ${n.unread ? 'bg-primary/3' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${n.unread ? 'bg-primary' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-on-surface truncate">{n.title || 'Notification'}</p>
                        <p className="text-[10px] text-on-surface-variant/60 mt-0.5 line-clamp-2">{n.message || n.body || ''}</p>
                        <p className="text-[9px] text-on-surface-variant/40 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                      </div>
                    </button>
                  )) : (
                    <div className="p-6 text-center text-xs text-on-surface-variant/50">No notifications</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-outline-variant/15">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-on-surface">{user?.name || 'User'}</p>
              <p className="text-[10px] text-primary font-medium">{user?.role || 'User'}</p>
            </div>
            <div className="relative group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm ring-[1.5px] ring-primary/25 overflow-hidden">
                {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : (user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary border-[1.5px] border-surface" />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-header for leads */}
      {location.pathname === '/leads' && (
        <div className="px-4 sm:px-6 lg:px-8 py-2.5 border-t border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest/50">
          <h2 className="text-xs font-semibold text-on-surface hidden sm:block">Deals Pipeline</h2>
          <div className="flex items-center gap-2 ml-auto">
            <button className="flex items-center gap-1.5 text-[10px] font-semibold text-on-surface-variant/60 hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg hover:bg-surface-container cursor-pointer">
              <Filter size={13} /> Filter
            </button>
            <button className="flex items-center gap-1.5 text-[10px] font-semibold text-on-surface-variant/60 hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg hover:bg-surface-container cursor-pointer">
              <ArrowUpDown size={13} /> Sort
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
