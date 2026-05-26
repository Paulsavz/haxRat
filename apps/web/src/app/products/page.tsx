'use client'
export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductGrid from '@/components/products/ProductGrid'
import { productsApi, categoriesApi } from '@/lib/api'
import type { Product, Category } from '@/types'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular', label: 'Most Popular' },
]

const PRICE_RANGES = [
  { label: 'Under GHS 50', min: 0, max: 50 },
  { label: 'GHS 50 – 200', min: 50, max: 200 },
  { label: 'GHS 200 – 500', min: 200, max: 500 },
  { label: 'Over GHS 500', min: 500, max: 99999 },
]

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>}>
      <ProductsPageInner />
    </Suspense>
  )
}

function ProductsPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Load categories
  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(console.error)
  }, [])

  const fetchProducts = useCallback(
    async (pageNum: number, replace = false) => {
      setLoading(true)
      try {
        const res = await productsApi.list({
          page: pageNum,
          per_page: 12,
          search: search || undefined,
          category: category || undefined,
          sort,
          min_price: priceRange?.min,
          max_price: priceRange?.max,
        })
        setProducts((prev) => (replace ? res.data : [...prev, ...res.data]))
        setHasMore(res.has_more)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    },
    [search, category, sort, priceRange]
  )

  // Reset and fetch on filter change
  useEffect(() => {
    setPage(1)
    fetchProducts(1, true)
  }, [fetchProducts])

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const next = page + 1
          setPage(next)
          fetchProducts(next)
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loading, page, fetchProducts])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setSort('newest')
    setPriceRange(null)
    router.replace('/products')
  }

  const activeFilterCount = [
    category,
    priceRange,
    search,
    sort !== 'newest' ? sort : null,
  ].filter(Boolean).length

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-ink-900">All Products</h1>
            {products.length > 0 && !loading && (
              <p className="mt-1 text-sm text-ink-500">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
              </p>
            )}
          </div>

          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-10"
              />
            </form>

            <div className="flex gap-2">
              {/* Filter toggle (mobile) */}
              <button
                onClick={() => setFilterOpen(true)}
                className={cn(
                  'btn-secondary flex items-center gap-2 lg:hidden',
                  activeFilterCount > 0 && 'border-primary-600 text-primary-600'
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="input-base appearance-none pr-9 cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            {/* ─── Sidebar (desktop) ─────────────────────────── */}
            <aside className="hidden w-56 shrink-0 lg:block">
              <FilterPanel
                categories={categories}
                selectedCategory={category}
                onCategoryChange={setCategory}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                onClear={clearFilters}
                activeFilterCount={activeFilterCount}
              />
            </aside>

            {/* ─── Product grid ──────────────────────────────── */}
            <div className="flex-1 min-w-0">
              <ProductGrid products={products} loading={loading && page === 1} cols={3} />

              {/* Loading more */}
              {loading && page > 1 && (
                <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="card animate-pulse overflow-hidden">
                      <div className="aspect-square bg-surface-200" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-surface-200" />
                        <div className="h-4 w-1/2 rounded bg-surface-200" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-4" />

              {/* End of results */}
              {!hasMore && products.length > 0 && (
                <p className="mt-8 text-center text-sm text-ink-400">
                  You&apos;ve seen all {products.length} products.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-widget"
            >
              <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4">
                <h2 className="font-semibold text-ink-900">Filters</h2>
                <button onClick={() => setFilterOpen(false)}>
                  <X className="h-5 w-5 text-ink-500" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto h-[calc(100%-65px)]">
                <FilterPanel
                  categories={categories}
                  selectedCategory={category}
                  onCategoryChange={(c) => { setCategory(c); setFilterOpen(false) }}
                  priceRange={priceRange}
                  onPriceRangeChange={(p) => { setPriceRange(p); setFilterOpen(false) }}
                  onClear={clearFilters}
                  activeFilterCount={activeFilterCount}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}

interface FilterPanelProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (cat: string) => void
  priceRange: { min: number; max: number } | null
  onPriceRangeChange: (range: { min: number; max: number } | null) => void
  onClear: () => void
  activeFilterCount: number
}

function FilterPanel({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  onClear,
  activeFilterCount,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      {activeFilterCount > 0 && (
        <button onClick={onClear} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium">
          <X className="h-3.5 w-3.5" />
          Clear all filters
        </button>
      )}

      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Category</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => onCategoryChange('')}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-left text-sm transition-all',
              !selectedCategory
                ? 'bg-primary-50 font-medium text-primary-700'
                : 'text-ink-600 hover:bg-surface-100'
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.slug)}
              className={cn(
                'w-full rounded-lg px-3 py-2 text-left text-sm transition-all flex items-center justify-between',
                selectedCategory === cat.slug
                  ? 'bg-primary-50 font-medium text-primary-700'
                  : 'text-ink-600 hover:bg-surface-100'
              )}
            >
              {cat.name}
              {cat.product_count !== undefined && (
                <span className="text-xs text-ink-400">{cat.product_count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Price Range</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => onPriceRangeChange(null)}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-left text-sm transition-all',
              !priceRange
                ? 'bg-primary-50 font-medium text-primary-700'
                : 'text-ink-600 hover:bg-surface-100'
            )}
          >
            Any Price
          </button>
          {PRICE_RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => onPriceRangeChange({ min: r.min, max: r.max })}
              className={cn(
                'w-full rounded-lg px-3 py-2 text-left text-sm transition-all',
                priceRange?.min === r.min && priceRange?.max === r.max
                  ? 'bg-primary-50 font-medium text-primary-700'
                  : 'text-ink-600 hover:bg-surface-100'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
