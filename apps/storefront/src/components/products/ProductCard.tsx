'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Eye } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency, discountPercent, cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import toast from 'react-hot-toast';
import type { Product } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const discount = discountPercent(product.price, product.compare_price ?? 0);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const mainImage = product.images[0] ?? '/placeholder-product.jpg';
  const hoverImage = product.images[1] ?? mainImage;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    setAddingToCart(true);
    addItem(product, 1);
    toast.success(`${product.name} added to cart`, {
      icon: '🛒',
      duration: 2000,
    });
    setTimeout(() => setAddingToCart(false), 600);
  };

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div
        className={cn(
          'bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300',
          isOutOfStock && 'opacity-80'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-surface-subtle">
          <Image
            src={isHovered && hoverImage !== mainImage ? hoverImage : mainImage}
            alt={product.name}
            fill
            className={cn(
              'object-cover transition-transform duration-500',
              isHovered && 'scale-110'
            )}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <Badge variant="danger" size="sm">-{discount}%</Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="warning" size="sm">Low Stock</Badge>
            )}
            {isOutOfStock && (
              <Badge variant="default" size="sm">Out of Stock</Badge>
            )}
          </div>

          {/* Quick view overlay */}
          <div className={cn(
            'absolute inset-x-0 bottom-0 flex items-center justify-center p-3 gap-2 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}>
            <span className="text-white text-xs font-medium flex items-center gap-1">
              <Eye size={12} /> Quick View
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          {product.category && (
            <p className="text-xs text-ink-faint font-medium uppercase tracking-wide mb-1">
              {product.category.name}
            </p>
          )}
          <h3 className="text-sm font-semibold text-ink line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-base font-bold text-ink">
                {formatCurrency(product.price)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="ml-1.5 text-xs text-ink-faint line-through">
                  {formatCurrency(product.compare_price)}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart}
              className={cn(
                'flex-shrink-0 p-2 rounded-xl transition-all duration-200',
                isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95 shadow-sm'
              )}
              aria-label="Add to cart"
            >
              <ShoppingCart size={16} className={cn(addingToCart && 'animate-bounce')} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
