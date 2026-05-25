import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Ticket, Handshake, CheckSquare,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat', path: '/chat', label: 'Chat', icon: MessageSquare },
  { id: 'tickets', path: '/tickets', label: 'Tickets', icon: Ticket },
  { id: 'leads', path: '/leads', label: 'Leads', icon: Handshake },
  { id: 'tasks', path: '/tasks', label: 'Tasks', icon: CheckSquare },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/15 safe-area-bottom">
      <div className="flex justify-around items-center w-full h-16 px-1 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.id === 'dashboard'}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                isActive ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant/70'
              }`}
            >
              <Icon size={20} />
              <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
