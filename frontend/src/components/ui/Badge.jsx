const colors = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  error: 'bg-error/10 text-error border-error/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  neutral: 'bg-surface-container-high text-on-surface-variant border-outline-variant/20',
};

export default function Badge({ children, color = 'neutral', dot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors[color]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${colors[color].split(' ')[1]}`} />}
      {children}
    </span>
  );
}
