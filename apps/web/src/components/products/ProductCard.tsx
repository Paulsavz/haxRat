'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCartStore } from '@/store/cartStore'
import { cn, formatCurrency, discountPercent } from '@/lib/utils'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    toast.success(`${product.name} added to cart`)
  }

  const discount =
    product.compare_price && product.compare_price > product.price
      ? discountPercent(product.compare_price, product.price)
      : 0

  const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'
  const inStock = product.stock > 0

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group relative"
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="card overflow-hidden transition-shadow hover:shadow-card-hover">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-surface-100">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />

            {/* Badges */}
            <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
              {discount > 0 && (
                <span className="badge bg-red-100 text-red-700 font-bold">
                  -{discount}%
                </span>
              )}
              {product.featured && (
                <span className="badge bg-amber-100 text-amber-700">
                  <TrendingUp className="mr-0.5 h-3 w-3" />
                  Hot
                </span>
              )}
              {!inStock && (
                <span className="badge bg-surface-200 text-ink-500">Out of stock</span>
              )}
            </div>

            {/* Quick add button */}
            <div className="absolute bottom-0 left-0 right-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={cn(
                  'flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-white transition-all',
                  inStock
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : 'bg-surface-400 cursor-not-allowed'
                )}
              >
                <ShoppingCart className="h-4 w-4" />
                {inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400 mb-1">
              {product.category?.name}
            </p>
            <h3 className="text-sm font-semibold text-ink-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>

            <div className="mt-2.5 flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-ink-900">
                    {formatCurrency(product.price)}
                  </span>
                  {discount > 0 && product.compare_price && (
                    <span className="text-xs text-ink-400 line-through">
                      {formatCurrency(product.compare_price)}
                    </span>
                  )}
                </div>
                {inStock && product.stock <= 5 && (
                  <p className="mt-0.5 text-xs text-amber-600 font-medium">
                    Only {product.stock} left!
                  </p>
                )}
              </div>

              {/* Rating placeholder */}
              <div className="flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs text-ink-500">4.8</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
