import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { get, post } from '../utils/api';
import {
  Bell,
  MessageSquare,
  Phone,
  Search,
  LogOut,
  User,
  Filter,
  ArrowUpDown
} from 'lucide-react';

const FacebookIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default function Topbar({ user, metaConnections }) {
  const navigate = useNavigate();
  const location = useLocation();

  const titleMap = {
    '/': 'Home Dashboard',
    '/chat': 'Inbox & Meta Conversations',
    '/dialer': 'Call Dialer',
    '/leads': 'Deals Pipeline',
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
    const interval = setInterval(getChats, 15000);
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
    const interval = setInterval(getNotifications, 15000);
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
      .then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      })
      .catch(err => console.error('Error marking all notifications read:', err));
  };

  const unreadNotifsCount = notifications.filter(n => n.unread).length;

  const services = [
    { name: 'Facebook Graph API', connected: metaConnections?.facebookConnected || false, icon: FacebookIcon, color: 'text-blue-500' },
    { name: 'WhatsApp Business API', connected: metaConnections?.whatsappConnected || false, icon: MessageSquare, color: 'text-emerald-500' },
    { name: 'Call SIP Server', connected: true, icon: Phone, color: 'text-primary' }
  ];

  return (
    <header className="bg-background/80 backdrop-blur-2xl top-0 sticky z-30 border-b border-outline-variant/20 shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center w-full px-8 h-20">
        {/* Search Bar */}
        <div className="flex-1 max-w-md relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors z-10" size={18} />
          <input
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-full py-2.5 pl-12 pr-4 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
            placeholder="Search deals, contacts, or companies..."
            type="text"
          />
        </div>

        {/* Trailing Actions */}
        <div className="flex items-center gap-4 ml-8">
          {/* Connection Statuses */}
          <div className="hidden lg:flex items-center gap-2">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-container-low border border-outline-variant/10 relative group cursor-help"
                  title={service.name}
                >
                  <Icon size={14} className={service.color} />
                  <span className={`w-1.5 h-1.5 rounded-full ${service.connected ? 'bg-primary' : 'bg-error'}`} />
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-surface-container-high text-xs text-on-surface px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-outline-variant/20">
                    {service.name}: {service.connected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Notifications */}
          <div className="relative topbar-dropdown-trigger">
            <button
              onClick={() => {
                setChatDropdownOpen(!chatDropdownOpen);
                setBellDropdownOpen(false);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all relative ${chatDropdownOpen ? 'text-primary bg-surface-container-high' : ''}`}
            >
              <MessageSquare size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-on-primary flex items-center justify-center border border-surface">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {chatDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-80 bg-surface-container-low/95 border border-outline-variant/20 rounded-xl shadow-2xl backdrop-blur-2xl overflow-hidden z-50 topbar-dropdown-menu">
                <div className="p-3.5 border-b border-outline-variant/20 bg-surface-container/50 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-on-surface">Recent Chats</h4>
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} Unread
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant/10">
                  {chats.length > 0 ? (
                    chats.map((chat) => (
                      <div
                        key={chat.participantId}
                        onClick={() => handleChatClick(chat.participantId)}
                        className={`p-3 hover:bg-surface-container/40 cursor-pointer flex gap-3 items-center transition-colors ${chat.unreadCount > 0 ? 'bg-primary/5' : ''}`}
                      >
                        <div className="relative flex-shrink-0">
                          {chat.pictureUrl ? (
                            <img
                              src={chat.pictureUrl}
                              alt={chat.participantName}
                              className="w-8 h-8 rounded-full object-cover border border-outline-variant/20"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs text-on-surface-variant">
                              {chat.participantName ? chat.participantName.charAt(0) : '?'}
                            </div>
                          )}
                          <span className={`w-2 h-2 rounded-full absolute bottom-0 right-0 border border-surface ${chat.platform === 'facebook' ? 'bg-blue-500' : 'bg-primary'}`} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>{chat.participantName}</p>
                            {chat.unreadCount > 0 && (
                              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-1.5" />
                            )}
                          </div>
                          <p className="text-[10px] text-on-surface-variant/60 truncate mt-0.5">{chat.lastMessage || 'No messages'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-on-surface-variant/50 text-xs">
                      No active conversations.
                    </div>
                  )}
                </div>
                <div className="p-2.5 border-t border-outline-variant/20 text-center bg-surface-container/50">
                  <button
                    onClick={() => {
                      navigate('/chat');
                      setChatDropdownOpen(false);
                    }}
                    className="text-[10px] text-primary hover:text-primary-fixed font-bold transition-colors"
                  >
                    View All Chats
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bell Notifications */}
          <div className="relative topbar-dropdown-trigger">
            <button
              onClick={() => {
                setBellDropdownOpen(!bellDropdownOpen);
                setChatDropdownOpen(false);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all relative ${bellDropdownOpen ? 'text-primary bg-surface-container-high' : ''}`}
            >
              <Bell size={20} />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-on-primary flex items-center justify-center border border-surface">
                  {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                </span>
              )}
            </button>

            {bellDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-96 bg-surface-container-low/95 border border-outline-variant/20 rounded-xl shadow-2xl backdrop-blur-2xl overflow-hidden z-50 topbar-dropdown-menu flex flex-col">
                <div className="p-3.5 border-b border-outline-variant/20 bg-surface-container/50 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-on-surface">Notifications</h4>
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                    {unreadNotifsCount} New
                  </span>
                </div>

                <div className="px-4 py-2 border-b border-outline-variant/20 bg-surface-container/30">
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-semibold text-on-surface-variant">
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
                            ? 'text-primary font-bold'
                            : 'hover:text-on-surface'
                        }`}
                      >
                        {cat}
                        {activeNotifTab === cat && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10">
                  {notifications.filter(n => {
                    if (activeNotifTab === 'All') return true;
                    if (activeNotifTab === 'Unread') return n.unread;
                    return n.type?.toLowerCase() === activeNotifTab.toLowerCase();
                  }).length > 0 ? (
                    notifications.filter(n => {
                      if (activeNotifTab === 'All') return true;
                      if (activeNotifTab === 'Unread') return n.unread;
                      return n.type?.toLowerCase() === activeNotifTab.toLowerCase();
                    }).map((notif) => (
                      <div
                        key={notif._id || notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 hover:bg-surface-container/40 cursor-pointer flex gap-3 transition-colors ${notif.unread ? 'bg-primary/5' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant flex-shrink-0 border border-outline-variant/10">
                          <User size={13} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-1.5 font-bold text-[11px] text-on-surface">
                              {notif.unread && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />}
                              <span>{notif.title}</span>
                            </div>
                            <span className="text-[9px] text-on-surface-variant/60 flex-shrink-0 font-medium mt-0.5">{notif.time}</span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant/70 mt-1 leading-relaxed">
                            {notif.desc}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-on-surface-variant/50 text-xs">
                      No notifications in this category.
                    </div>
                  )}
                </div>

                <div className="p-2.5 border-t border-outline-variant/20 bg-surface-container/50 flex justify-between items-center text-[10px] px-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="text-on-surface-variant/70 hover:text-on-surface font-bold transition-colors"
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
                      className="text-primary hover:text-primary-fixed font-bold transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-3 border-l border-outline-variant/20 pl-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-on-surface">{user?.name || 'User'}</p>
              <p className="text-xs text-primary font-medium">{user?.role || 'User'}</p>
            </div>
            <div className="relative group cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-primary/30 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  (user?.name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface" />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-header / Filters - only on leads page */}
      {location.pathname === '/leads' && (
        <div className="px-8 py-3 border-t border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest/50 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <h2 className="font-body-lg text-body-lg font-semibold text-on-surface flex items-center gap-2">
              Deals Pipeline
              <span className="material-symbols-outlined text-sm text-on-surface-variant">keyboard_arrow_down</span>
            </h2>
            <div className="h-4 w-px bg-outline-variant/30 hidden sm:block"></div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-surface-container">
              <Filter size={16} /> Filter
            </button>
            <button className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-surface-container">
              <ArrowUpDown size={16} /> Sort
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
