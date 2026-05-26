'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, ShoppingCart, Minus, Plus, MessageCircle, Phone, Video, Star, Truck, ShieldCheck, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/store/cartStore'
import { useCommunicationStore } from '@/store/communicationStore'
import { cn, formatCurrency, discountPercent } from '@/lib/utils'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  product: Product
}

export default function ProductDetailClient({ product }: Props) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((s) => s.addItem)
  const openWidget = useCommunicationStore((s) => s.openWidget)

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop']

  const discount =
    product.compare_price && product.compare_price > product.price
      ? discountPercent(product.compare_price, product.price)
      : 0

  const inStock = product.stock > 0

  const handleAddToCart = () => {
    addItem(product, quantity)
    toast.success(`${product.name} added to cart!`)
  }

  const handleBuyNow = () => {
    addItem(product, quantity)
    window.location.href = '/checkout'
  }

  return (
    <div className="animate-in">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-ink-500">
        <Link href="/" className="hover:text-primary-600">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-primary-600">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-primary-600">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ink-900 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* ─── Image gallery ──────────────────────────── */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {discount > 0 && (
              <div className="absolute left-4 top-4">
                <span className="badge bg-red-600 text-white text-sm font-bold px-3 py-1">
                  -{discount}%
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                    selectedImage === i
                      ? 'border-primary-600 shadow-md'
                      : 'border-surface-200 hover:border-surface-300'
                  )}
                >
                  <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Product info ────────────────────────────── */}
        <div className="space-y-6">
          {/* Category + title */}
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-sm font-semibold uppercase tracking-wide text-primary-600 hover:text-primary-700"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="text-2xl font-bold text-ink-900 md:text-3xl leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn('h-4 w-4', i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-surface-200 text-surface-200')} />
              ))}
            </div>
            <span className="text-sm text-ink-500">4.8 · 124 reviews</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-ink-900">
              {formatCurrency(product.price)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-lg text-ink-400 line-through">
                {formatCurrency(product.compare_price)}
              </span>
            )}
            {discount > 0 && (
              <span className="badge bg-red-100 text-red-700 text-sm">
                Save {discount}%
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                inStock ? 'bg-green-500' : 'bg-red-400'
              )}
            />
            <span className={cn('text-sm font-medium', inStock ? 'text-green-700' : 'text-red-600')}>
              {inStock
                ? product.stock <= 5
                  ? `Only ${product.stock} left in stock!`
                  : `In Stock (${product.stock} available)`
                : 'Out of Stock'}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm leading-7 text-ink-600">{product.description}</p>

          {/* Quantity */}
          {inStock && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-ink-700">Quantity:</span>
              <div className="flex items-center rounded-xl border border-surface-200 overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center text-ink-600 transition-all hover:bg-surface-100 disabled:opacity-40"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-semibold text-ink-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="flex h-10 w-10 items-center justify-center text-ink-600 transition-all hover:bg-surface-100 disabled:opacity-40"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="btn-secondary flex-1 py-3"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!inStock}
              className="btn-primary flex-1 py-3"
            >
              Buy Now
            </button>
          </div>

          {/* Talk to Us */}
          <div className="rounded-2xl border border-surface-200 p-4 bg-surface-50">
            <p className="mb-3 text-sm font-semibold text-ink-700">
              Have questions about this product?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openWidget('chat')}
                className="btn-ghost text-xs border border-surface-200 rounded-lg px-3 py-2"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Live Chat
              </button>
              <button
                onClick={() => openWidget('audio')}
                className="btn-ghost text-xs border border-surface-200 rounded-lg px-3 py-2"
              >
                <Phone className="h-3.5 w-3.5" />
                Audio Call
              </button>
              <button
                onClick={() => openWidget('video')}
                className="btn-ghost text-xs border border-surface-200 rounded-lg px-3 py-2"
              >
                <Video className="h-3.5 w-3.5" />
                Video Call
              </button>
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: 'Fast Delivery' },
              { icon: ShieldCheck, label: 'Secure Payment' },
              { icon: Package, label: 'Easy Returns' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-50 p-3 text-center">
                <Icon className="h-5 w-5 text-primary-600" />
                <span className="text-xs font-medium text-ink-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
