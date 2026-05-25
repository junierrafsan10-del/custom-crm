import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-primary text-on-primary hover:brightness-110 shadow-lg shadow-primary/15 active:scale-[0.97]',
  secondary: 'bg-surface-container-high text-on-surface hover:bg-surface-container-higher border border-outline-variant/20 active:scale-[0.97]',
  ghost: 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high active:scale-[0.97]',
  danger: 'bg-error/10 text-error hover:bg-error/20 border border-error/20 active:scale-[0.97]',
  outline: 'bg-transparent text-on-surface border border-outline-variant/30 hover:bg-surface-container-high active:scale-[0.97]',
};

const sizes = {
  xs: 'px-2 py-1 text-[10px] gap-1',
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

const Button = forwardRef(({ variant = 'primary', size = 'md', icon, children, className = '', disabled, loading, ...props }, ref) => (
  <motion.button
    ref={ref}
    whileTap={disabled ? undefined : 'tap'}
    variants={{ tap: { scale: 0.97 } }}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  >
    {loading ? (
      <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
    ) : icon ? (
      <span className="flex-shrink-0">{icon}</span>
    ) : null}
    {children && <span>{children}</span>}
  </motion.button>
));

Button.displayName = 'Button';
export default Button;
