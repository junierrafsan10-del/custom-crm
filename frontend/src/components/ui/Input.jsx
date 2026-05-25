import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={`w-full bg-surface-container-low border ${error ? 'border-error/50 focus:border-error focus:ring-error/20' : 'border-outline-variant/20 focus:border-primary focus:ring-primary/20'} rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-1 transition-all ${icon ? 'pl-9' : ''} ${className}`}
        {...props}
      />
    </div>
    {error && <p className="text-[11px] text-error font-medium">{error}</p>}
  </div>
));

Input.displayName = 'Input';
export default Input;
