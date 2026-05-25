import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ icon, title, description, action, actionLabel }) {
  const Icon = icon || Inbox;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 border border-dashed border-outline-variant/20 rounded-2xl bg-surface-container-low/20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4">
        <Icon size={24} className="text-on-surface-variant/40" />
      </div>
      <h3 className="text-sm font-semibold text-on-surface">{title || 'Nothing here yet'}</h3>
      {description && <p className="text-xs text-on-surface-variant/60 mt-1.5 max-w-sm leading-relaxed">{description}</p>}
      {action && (
        <Button variant="primary" size="sm" className="mt-5" onClick={action}>
          {actionLabel || 'Get started'}
        </Button>
      )}
    </div>
  );
}
