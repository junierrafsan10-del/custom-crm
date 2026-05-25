import { motion } from 'framer-motion';

export default function PageHeader({ title, description, action, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
    >
      <div>
        <h1 className="text-xl font-bold text-on-surface tracking-tight">{title}</h1>
        {description && <p className="text-sm text-on-surface-variant/70 mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </motion.div>
  );
}
