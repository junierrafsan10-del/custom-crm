import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  Ticket,
  Phone,
  Contact,
  CheckSquare,
  ShieldCheck,
  Settings,
  Handshake,
  LogOut
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat', path: '/chat', label: 'Inbox & Meta Chat', icon: MessageSquare },
  { id: 'tickets', path: '/tickets', label: 'Tickets Portal', icon: Ticket },
  { id: 'dialer', path: '/dialer', label: 'Dialer & Calls', icon: Phone },
  { id: 'leads', path: '/leads', label: 'Deals', icon: Handshake },
  { id: 'users', path: '/users', label: 'Users', icon: Contact },
  { id: 'tasks', path: '/tasks', label: 'Task Management', icon: CheckSquare },
  { id: 'members', path: '/members', label: 'Members', icon: ShieldCheck },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const item = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0 }
};

export default function Sidebar({ onLogout, user }) {
  const displayName = user?.name || 'User';
  const displayRole = user?.role || 'User';
  const avatarUrl = user?.avatar || '';

  return (
    <nav className="bg-surface-container-lowest h-screen w-72 flex flex-col fixed left-0 top-0 border-r border-outline-variant/30 z-40 hidden md:flex">
      <div className="flex flex-col h-full py-8 w-full px-5">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8 px-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-lg font-bold">C</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-primary tracking-tight">Custom CRM</h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.12em] mt-0.5 font-medium">Intelligent Suite</p>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full bg-primary text-on-primary text-sm font-semibold py-2.5 rounded-full hover:bg-primary-fixed transition-all mb-6 flex items-center justify-center gap-2 active:scale-[0.97] shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Record
        </button>

        {/* Main Navigation */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex-1 space-y-0.5"
        >
          {menuItems.map((menuItem) => {
            const Icon = menuItem.icon;
            return (
              <motion.div key={menuItem.id} variants={item}>
                <NavLink
                  to={menuItem.path}
                  end={menuItem.id === 'dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'text-primary bg-primary/8 border-l-2 border-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`
                  }
                >
                  <Icon
                    size={18}
                    className="flex-shrink-0 transition-colors duration-200"
                  />
                  <span>{menuItem.label}</span>
                </NavLink>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer */}
        <div className="pt-4 border-t border-outline-variant/20 mt-auto">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'text-primary bg-primary/8 border-l-2 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`
            }
          >
            <Settings size={18} className="flex-shrink-0 transition-colors duration-200" />
            <span>Settings</span>
          </NavLink>
        </div>

        {/* User Profile */}
        <div className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-container-low/80 border border-outline-variant/10">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-on-surface truncate">{displayName}</p>
            <p className="text-[11px] text-on-surface-variant truncate font-medium">{displayRole}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-on-surface-variant hover:text-error transition-colors p-1 rounded hover:bg-error/10"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </nav>
  );
}
