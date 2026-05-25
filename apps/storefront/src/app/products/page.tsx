'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { ProductGrid } from '../../components/products/ProductGrid';
import { ProductFilters, FilterContent } from '../../components/products/ProductFilters';
import { Button } from '../../components/ui/Button';
import { productsApi, categoriesApi } from '../../lib/api';
import type { Product, Category, ProductFilters as Filters } from '../../types';

// ─── Sort Options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'popular',   label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
];

const POPULAR_TAGS = ['Sale', 'New', 'Organic', 'Premium', 'Bundle', 'Imported'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('search') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    sortBy: (searchParams.get('sort') as Filters['sortBy']) ?? 'newest',
    page: 1,
    limit: 20,
  });

  // Load categories once
  useEffect(() => {
    categoriesApi.list()
      .then((r) => setCategories(r.data))
      .catch(console.error);
  }, []);

  // Load products when filters change
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number | boolean> = {
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
          sortBy: filters.sortBy ?? 'newest',
        };
        if (filters.search) params.search = filters.search;
        if (filters.category) params.category = filters.category;
        if (filters.minPrice != null) params.minPrice = filters.minPrice;
        if (filters.maxPrice != null) params.maxPrice = filters.maxPrice;
        if (filters.tags?.length) params.tags = filters.tags.join(',');

        const res = await productsApi.list(params);
        if (filters.page === 1) {
          setProducts(res.data);
        } else {
          setProducts((prev) => [...prev, ...res.data]);
        }
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [filters]);

  // Sync URL params -> filters
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    if (search || category) {
      setFilters((f) => ({
        ...f,
        search: search ?? undefined,
        category: category ?? undefined,
        page: 1,
      }));
    }
  }, [searchParams]);

  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters({ ...newFilters, page: 1, limit: 20, sortBy: filters.sortBy });
    setProducts([]);
  }, [filters.sortBy]);

  const handleClearFilters = () => {
    setFilters({ page: 1, limit: 20, sortBy: 'newest' });
    setProducts([]);
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    setShowSort(false);
    setFilters((f) => ({ ...f, sortBy: value as Filters['sortBy'], page: 1 }));
    setProducts([]);
  };

  const loadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      setFilters((f) => ({ ...f, page: nextPage }));
    }
  };

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSort(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentSort = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-ink">All Products</h1>
        <p className="text-ink-muted text-sm mt-1">
          {isLoading && page === 1 ? 'Loading…' : `${total.toLocaleString()} products found`}
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value;
            handleFilterChange({ ...filters, search: q || undefined });
          }}
          className="flex gap-3"
        >
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              name="q"
              type="search"
              defaultValue={filters.search}
              placeholder="Search products, brands, categories…"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <Button type="submit" variant="primary" leftIcon={<Search size={15} />}>
            Search
          </Button>
        </form>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          {/* Mobile filter button inside ProductFilters */}
          <ProductFilters
            categories={categories}
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
            popularTags={POPULAR_TAGS}
          />
        </div>

        {/* Sort */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-ink hover:border-gray-300 transition-colors"
          >
            <ArrowUpDown size={14} className="text-ink-faint" />
            {currentSort}
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lifted border border-gray-100 z-20 animate-scale-in overflow-hidden">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSort(opt.value)}
                  className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${
                    sortBy === opt.value
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-ink hover:bg-surface-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Desktop filter sidebar */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-soft p-4 sticky top-24">
            <h2 className="text-base font-semibold text-ink mb-4">Filters</h2>
            <FilterContent
              categories={categories}
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
              popularTags={POPULAR_TAGS}
            />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          <ProductGrid
            products={products}
            isLoading={isLoading && page === 1}
            columns={3}
          />

          {/* Load more */}
          {!isLoading && page < totalPages && (
            <div className="flex justify-center mt-8">
              <Button variant="secondary" onClick={loadMore} loading={isLoading && page > 1}>
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
