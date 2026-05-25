'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart,
  MessageCircle, Phone, Star, Truck, Shield, ArrowLeft,
  ZoomIn,
} from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';
import { useChatStore } from '../../../store/chatStore';
import { productsApi } from '../../../lib/api';
import { formatCurrency, discountPercent, cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';
import { Badge, OrderStatusBadge } from '../../../components/ui/Badge';
import { ProductGrid } from '../../../components/products/ProductGrid';
import { Skeleton } from '../../../components/ui/Skeleton';
import toast from 'react-hot-toast';
import type { Product } from '../../../types';

// ─── Image Gallery ────────────────────────────────────────────────────────────

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (!images.length) {
    return (
      <div className="aspect-square bg-surface-muted rounded-3xl flex items-center justify-center">
        <span className="text-6xl">📦</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="relative aspect-square rounded-3xl overflow-hidden bg-surface-subtle cursor-zoom-in group"
        onClick={() => setZoomed(!zoomed)}
      >
        <Image
          src={images[active]}
          alt={`${name} - image ${active + 1}`}
          fill
          className={cn(
            'object-cover transition-transform duration-300',
            zoomed ? 'scale-150' : 'group-hover:scale-105'
          )}
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={12} /> Zoom
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + images.length) % images.length); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % images.length); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors',
                i === active ? 'border-primary-600' : 'border-transparent hover:border-gray-300'
              )}
            >
              <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quantity Selector ────────────────────────────────────────────────────────

function QuantitySelector({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-fit">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="w-10 h-10 flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Minus size={16} />
      </button>
      <span className="w-12 text-center text-sm font-semibold">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: { slug: string };
}

export default function ProductDetailPage({ params }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const openChat = useChatStore((s) => s.openChat);

  useEffect(() => {
    setIsLoading(true);
    productsApi.get(params.slug)
      .then((res) => {
        setProduct(res.data);
        setIsLoading(false);
        // Load related
        productsApi.related(res.data.id)
          .then((r) => setRelated(r.data.slice(0, 4)))
          .catch(console.error);
      })
      .catch(() => setIsLoading(false));
  }, [params.slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    addItem(product, quantity, selectedVariants);
    toast.success(`${quantity}x ${product.name} added to cart`, { icon: '🛒' });
    setTimeout(() => setAdding(false), 600);
  };

  const handleVariantSelect = (variantName: string, option: string) => {
    setSelectedVariants((prev) => ({ ...prev, [variantName]: option }));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="aspect-square" rounded="rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-4xl mb-4">😕</p>
        <h1 className="text-xl font-semibold text-ink mb-2">Product not found</h1>
        <Link href="/products">
          <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  const discount = discountPercent(product.price, product.compare_price ?? 0);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-ink">Products</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <ImageGallery images={product.images} name={product.name} />

        {/* Info */}
        <div className="flex flex-col gap-5">
          {/* Category + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-xs font-semibold text-primary-600 uppercase tracking-wider hover:text-primary-700"
              >
                {product.category.name}
              </Link>
            )}
            {discount > 0 && <Badge variant="danger">-{discount}% OFF</Badge>}
            {isLowStock && <Badge variant="warning" dot>Only {product.stock} left</Badge>}
            {isOutOfStock && <Badge variant="default">Out of Stock</Badge>}
            {product.is_featured && <Badge variant="primary">Featured</Badge>}
          </div>

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink leading-tight">
            {product.name}
          </h1>

          {/* Rating (mock) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={14}
                  className={i <= 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-sm text-ink-muted">(48 reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-ink">{formatCurrency(product.price)}</span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-lg text-ink-faint line-through">
                {formatCurrency(product.compare_price)}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-ink-muted leading-relaxed text-sm">{product.description}</p>
          )}

          {/* Variants */}
          {product.variants.map((variant) => (
            <div key={variant.name}>
              <p className="text-sm font-semibold text-ink mb-2">{variant.name}:</p>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleVariantSelect(variant.name, opt)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors',
                      selectedVariants[variant.name] === opt
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-ink hover:border-gray-300'
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-surface-muted rounded-lg text-xs text-ink-muted">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Quantity + Add */}
          <div className="flex items-center gap-4 pt-2">
            <QuantitySelector
              value={quantity}
              max={product.stock}
              onChange={setQuantity}
            />
            <Button
              fullWidth
              size="lg"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              loading={adding}
              leftIcon={<ShoppingCart size={18} />}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>

          {/* Talk to us */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<MessageCircle size={16} />}
              onClick={openChat}
              className="flex-1"
            >
              Chat with us
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Phone size={16} />}
              onClick={openChat}
              className="flex-1"
            >
              Request Call
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Truck size={15} className="text-primary-500" />
              Fast Delivery
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Shield size={15} className="text-primary-500" />
              Secure Payment
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-display font-bold text-ink mb-6">You Might Also Like</h2>
          <ProductGrid products={related} columns={4} />
        </section>
      )}
    </div>
  );
}
