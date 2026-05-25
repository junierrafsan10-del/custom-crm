import { motion } from 'framer-motion';

export default function Card({ children, className = '', variant = 'default', padding = true, hover = false, ...props }) {
  const base = variant === 'glass'
    ? 'glass-panel rounded-xl'
    : variant === 'elevated'
      ? 'bg-surface-container-low border border-outline-variant/10 rounded-xl shadow-lg'
      : 'bg-surface-container-low/50 border border-outline-variant/10 rounded-xl';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${base} ${padding ? 'p-5' : ''} ${hover ? 'hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-5 ${className}`}>
      <div>
        {title && <h3 className="text-sm font-semibold text-on-surface">{title}</h3>}
        {subtitle && <p className="text-xs text-on-surface-variant/70 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
