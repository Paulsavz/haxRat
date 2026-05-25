'use client';

import { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import type { Category, ProductFilters as Filters } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductFiltersProps {
  categories: Category[];
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
  popularTags?: string[];
}

// ─── Price Range Slider ───────────────────────────────────────────────────────

function PriceSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>GH₵ {value[0]}</span>
        <span>GH₵ {value[1]}</span>
      </div>
      <div className="flex gap-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v < value[1]) onChange([v, value[1]]);
          }}
          className="w-full accent-primary-600"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v > value[0]) onChange([value[0], v]);
          }}
          className="w-full accent-primary-600"
        />
      </div>
    </div>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2 text-sm font-semibold text-ink"
      >
        {title}
        <ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

// ─── Filter Content ───────────────────────────────────────────────────────────

export function FilterContent({
  categories,
  filters,
  onChange,
  onClear,
  popularTags = [],
}: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 1000,
  ]);

  const hasActiveFilters = !!(
    filters.category ||
    filters.minPrice ||
    filters.maxPrice ||
    (filters.tags && filters.tags.length > 0)
  );

  const handleCategoryChange = (slug: string) => {
    onChange({ ...filters, category: filters.category === slug ? undefined : slug });
  };

  const handleTagToggle = (tag: string) => {
    const tags = filters.tags ?? [];
    onChange({
      ...filters,
      tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
    });
  };

  const handlePriceCommit = () => {
    onChange({ ...filters, minPrice: priceRange[0], maxPrice: priceRange[1] });
  };

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium"
        >
          <X size={12} /> Clear all filters
        </button>
      )}

      {/* Categories */}
      <FilterSection title="Category">
        <div className="space-y-1">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={filters.category === cat.slug}
                onChange={() => handleCategoryChange(cat.slug)}
                className="accent-primary-600"
              />
              <span className="text-sm text-ink group-hover:text-primary-600 transition-colors">
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <PriceSlider
          min={0}
          max={1000}
          value={priceRange}
          onChange={setPriceRange}
        />
        <Button
          size="sm"
          variant="secondary"
          fullWidth
          onClick={handlePriceCommit}
          className="mt-3"
        >
          Apply Price
        </Button>
      </FilterSection>

      {/* Tags */}
      {popularTags.length > 0 && (
        <FilterSection title="Tags">
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => {
              const active = (filters.tags ?? []).includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    active
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-ink border-gray-200 hover:border-primary-400'
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}
    </div>
  );
}

// ─── Mobile Filter Button + Sheet ─────────────────────────────────────────────

export function ProductFilters(props: ProductFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasActiveFilters = !!(
    props.filters.category ||
    props.filters.minPrice ||
    props.filters.maxPrice ||
    (props.filters.tags && props.filters.tags.length > 0)
  );

  return (
    <>
      {/* Mobile button */}
      <div className="lg:hidden">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<SlidersHorizontal size={14} />}
          onClick={() => setMobileOpen(true)}
        >
          Filters{hasActiveFilters ? ' •' : ''}
        </Button>

        {/* Mobile bottom sheet */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex items-end">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative w-full bg-white rounded-t-3xl shadow-float p-6 max-h-[80vh] overflow-y-auto animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button onClick={() => setMobileOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <FilterContent {...props} />
              <Button
                fullWidth
                className="mt-4"
                onClick={() => setMobileOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
