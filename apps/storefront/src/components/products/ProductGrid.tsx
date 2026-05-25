import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from '../ui/Skeleton';
import type { Product } from '../../types';
import { cn } from '../../lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductGridProps {
  products?: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
  columns?: 2 | 3 | 4;
  priorityCount?: number;
}

const colClasses = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductGrid({
  products,
  isLoading,
  skeletonCount = 8,
  columns = 4,
  priorityCount = 4,
}: ProductGridProps) {
  const gridClass = cn('grid gap-4', colClasses[columns]);

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-surface-muted rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">🛍️</span>
        </div>
        <h3 className="text-lg font-semibold text-ink mb-2">No products found</h3>
        <p className="text-ink-muted text-sm">Try adjusting your filters or search term.</p>
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < priorityCount} />
      ))}
    </div>
  );
}
