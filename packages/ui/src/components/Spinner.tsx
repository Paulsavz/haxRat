import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

export interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 20, className, label }: SpinnerProps) {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <Loader2 className={cn('animate-spin text-brand-500', className)} size={size} aria-hidden />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <span className="sr-only">{label ?? 'Loading'}</span>
    </span>
  );
}

/** Full-area centered spinner for loading states inside a panel. */
export function LoadingOverlay({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Spinner size={28} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
