import { type HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Use a moving shimmer instead of a soft pulse. */
  shimmer?: boolean;
}

/** Loading placeholder. Size it with width/height utilities. */
export function Skeleton({ className, shimmer, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-surface-muted',
        shimmer
          ? 'relative overflow-hidden after:absolute after:inset-0 after:bg-shimmer-gradient after:bg-[length:200%_100%] after:animate-shimmer'
          : 'animate-pulse-soft',
        className
      )}
      {...props}
    />
  );
}

/** A ready-made skeleton roughly shaped like a content card. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-surface p-5 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton shimmer className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton shimmer className="h-3.5 w-1/3" />
          <Skeleton shimmer className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton shimmer className="h-3 w-full" />
      <Skeleton shimmer className="h-3 w-4/5" />
    </div>
  );
}
