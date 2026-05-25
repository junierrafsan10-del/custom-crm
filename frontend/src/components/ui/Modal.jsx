import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, subtitle, children, size = 'md', className = '' }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`relative w-full ${widths[size]} bg-surface-container border border-outline-variant/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden ${className}`}
          >
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-outline-variant/10">
                <div className="min-w-0">
                  {title && <h3 className="text-sm font-bold text-on-surface">{title}</h3>}
                  {subtitle && <p className="text-xs text-on-surface-variant/70 mt-1">{subtitle}</p>}
                </div>
                {onClose && (
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0 cursor-pointer">
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
