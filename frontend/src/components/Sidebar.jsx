import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Ticket,
  Phone, 
  Users, 
  Contact,
  CheckSquare, 
  ShieldCheck, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

export default function Sidebar({ sidebarOpen, setSidebarOpen, onLogout }) {
  const menuItems = [
    { id: 'dashboard', path: '/', label: 'Home Dashboard', icon: LayoutDashboard },
    { id: 'chat', path: '/chat', label: 'Inbox & Meta Chat', icon: MessageSquare },
    { id: 'tickets', path: '/tickets', label: 'Tickets Portal', icon: Ticket },
    { id: 'dialer', path: '/dialer', label: 'Dialer & Calls', icon: Phone },
    { id: 'leads', path: '/leads', label: 'Lead Database', icon: Users },
    { id: 'users', path: '/users', label: 'Users', icon: Contact },
    { id: 'tasks', path: '/tasks', label: 'Task Management', icon: CheckSquare },
    { id: 'members', path: '/members', label: 'Members', icon: ShieldCheck },
    { id: 'settings', path: '/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen glass-panel z-40 transition-all duration-300 flex flex-col border-r border-slate-800 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <span className="font-bold text-white text-lg">C</span>
          </div>
          {sidebarOpen && (
            <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent transition-opacity duration-200">
              Custom CRM
            </span>
          )}
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.id === 'dashboard'}
              className={({ isActive }) => `sidebar-item w-full flex items-center gap-4 px-3 py-3.5 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Icon size={20} className="text-inherit" />
              {sidebarOpen ? (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              ) : (
                <div className="sidebar-tooltip">{item.label}</div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer / Log Out */}
      <div className="p-3 border-t border-slate-800/60">
        <button 
          onClick={onLogout}
          className="sidebar-item w-full flex items-center gap-4 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200 group relative"
        >
          <LogOut size={20} />
          {sidebarOpen ? (
            <span className="text-sm font-medium">Logout</span>
          ) : (
            <div className="sidebar-tooltip bg-red-950 text-red-200">Logout</div>
          )}
        </button>
      </div>
    </aside>
  );
}
