import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Ticket, Phone, Contact,
  CheckSquare, ShieldCheck, Settings, Handshake, LogOut,
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat', path: '/chat', label: 'Inbox & Chat', icon: MessageSquare },
  { id: 'tickets', path: '/tickets', label: 'Tickets', icon: Ticket },
  { id: 'dialer', path: '/dialer', label: 'Dialer', icon: Phone },
  { id: 'leads', path: '/leads', label: 'Deals', icon: Handshake },
  { id: 'users', path: '/users', label: 'Users', icon: Contact },
  { id: 'tasks', path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'members', path: '/members', label: 'Members', icon: ShieldCheck },
];

export default function Sidebar({ onLogout, user }) {
  const location = useLocation();
  const displayName = user?.name || 'User';
  const displayRole = user?.role || 'User';
  const avatarUrl = user?.avatar || '';

  return (
    <nav className="bg-surface-container-lowest h-screen w-72 flex flex-col fixed left-0 top-0 border-r border-outline-variant/20 z-40 hidden md:flex">
      <div className="flex flex-col h-full py-7 w-full px-4">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-7 px-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/10">
            <span className="text-primary text-lg font-bold">C</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-primary tracking-tight">Custom CRM</h1>
            <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-[0.15em] mt-0.5 font-semibold">Intelligent Suite</p>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.id === 'dashboard'}
                className={`flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'text-primary bg-primary/8 border-l-[2.5px] border-primary shadow-sm'
                    : 'text-on-surface-variant/70 hover:bg-surface-container-high hover:text-on-surface border-l-[2.5px] border-transparent'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Settings */}
        <div className="pt-4 border-t border-outline-variant/10 mt-auto">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-primary bg-primary/8 border-l-[2.5px] border-primary shadow-sm'
                  : 'text-on-surface-variant/70 hover:bg-surface-container-high hover:text-on-surface border-l-[2.5px] border-transparent'
              }`
            }
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </div>

        {/* User Profile */}
        <div className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/10">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm border border-primary/15 overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">{displayName}</p>
            <p className="text-[10px] text-on-surface-variant/60 truncate font-medium">{displayRole}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-on-surface-variant/50 hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error/10 flex-shrink-0 cursor-pointer"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </nav>
  );
}
