import { cn } from '../../lib/utils';

// ─── Base Skeleton ────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  rounded?: string;
}

export function Skeleton({ className, rounded = 'rounded-xl' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-100',
        rounded,
        className
      )}
    >
      <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}

// ─── Product Card Skeleton ────────────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-soft">
      <Skeleton className="h-48 w-full" rounded="rounded-none" />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between mt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Order List Skeleton ──────────────────────────────────────────────────────

export function OrderRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-soft flex items-center gap-4">
      <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

// ─── Text Skeleton ────────────────────────────────────────────────────────────

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  );
}
