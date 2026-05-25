import { motion, AnimatePresence } from 'framer-motion';

const variantStyles = {
  success: 'border-primary/30 text-primary',
  error: 'border-error/30 text-error',
  warning: 'border-amber-500/30 text-amber-400',
  info: 'border-sky-500/30 text-sky-400',
};

export default function Toast({ show, message, variant = 'success', onDismiss }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onDismiss}
          className={`fixed bottom-6 right-6 z-50 bg-surface-container border ${variantStyles[variant]} px-4 py-3.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-3 cursor-pointer max-w-sm`}
        >
          <div className={`w-2 h-2 rounded-full ${variant === 'success' ? 'bg-primary' : variant === 'error' ? 'bg-error' : variant === 'warning' ? 'bg-amber-500' : 'bg-sky-500'} animate-ping`} />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
