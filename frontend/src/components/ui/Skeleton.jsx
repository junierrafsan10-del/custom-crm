export default function Skeleton({ className = '', variant = 'text' }) {
  const base = 'animate-pulse bg-surface-container-high rounded';
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-xl',
    button: 'h-9 w-24 rounded-lg',
    input: 'h-9 w-full rounded-lg',
  };

  return <div className={`${base} ${variants[variant]} ${className}`} />;
}

export function SkeletonCard({ lines = 4 }) {
  return (
    <div className="glass-panel rounded-xl p-5 space-y-3">
      <Skeleton variant="title" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 p-3 bg-surface-container-high/50 rounded-lg">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
