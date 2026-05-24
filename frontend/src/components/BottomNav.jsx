import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Ticket,
  Handshake,
  CheckSquare,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat', path: '/chat', label: 'Chat', icon: MessageSquare },
  { id: 'tickets', path: '/tickets', label: 'Tickets', icon: Ticket },
  { id: 'leads', path: '/leads', label: 'Leads', icon: Handshake },
  { id: 'tasks', path: '/tasks', label: 'Tasks', icon: CheckSquare },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-surface-container-lowest border-t border-outline-variant/30 safe-area-bottom">
      <div className="flex justify-around items-center w-full h-16 px-2 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.id === 'dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-colors duration-200 min-w-0 flex-1 ${
                  isActive
                    ? 'text-primary'
                    : 'text-on-surface-variant/60 hover:text-on-surface-variant'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
