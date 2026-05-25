import { forwardRef } from 'react';

const Select = forwardRef(({ label, error, options, placeholder, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
        {label}
      </label>
    )}
    <select
      ref={ref}
      className={`w-full bg-surface-container-low border ${error ? 'border-error/50' : 'border-outline-variant/20'} rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return <option key={value} value={value}>{label}</option>;
      })}
    </select>
    {error && <p className="text-[11px] text-error font-medium">{error}</p>}
  </div>
));

Select.displayName = 'Select';
export default Select;
