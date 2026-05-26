import ProductCard from './ProductCard'
import type { Product } from '@/types'

interface Props {
  products: Product[]
  loading?: boolean
  cols?: 2 | 3 | 4
}

function ProductSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-square bg-surface-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-1/3 rounded bg-surface-200" />
        <div className="h-4 w-4/5 rounded bg-surface-200" />
        <div className="h-4 w-3/5 rounded bg-surface-200" />
        <div className="mt-3 h-5 w-1/3 rounded bg-surface-200" />
      </div>
    </div>
  )
}

const colsMap: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
}

export default function ProductGrid({ products, loading = false, cols = 4 }: Props) {
  const gridClass = `grid gap-4 sm:gap-5 ${colsMap[cols]}`

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
          <svg className="h-8 w-8 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-ink-700">No products found</h3>
        <p className="mt-1 text-sm text-ink-400">Try adjusting your filters or search terms.</p>
      </div>
    )
  }

  return (
    <div className={gridClass}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
