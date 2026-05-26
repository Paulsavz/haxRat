'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, Tag, ShoppingBag, ArrowRight, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import { cartApi } from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCartStore()
  const [coupon, setCoupon] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [discount, setDiscount] = useState<{ amount: number; code: string } | null>(null)

  const SHIPPING = subtotal() >= 200 ? 0 : 20
  const discountAmount = discount ? discount.amount : 0
  const total = subtotal() - discountAmount + SHIPPING

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return
    setCouponLoading(true)
    try {
      const res = await cartApi.applyCoupon(coupon.trim().toUpperCase())
      const amount =
        res.type === 'percent'
          ? (subtotal() * res.discount) / 100
          : res.discount
      setDiscount({ amount, code: coupon.trim().toUpperCase() })
      toast.success('Coupon applied!')
    } catch {
      toast.error('Invalid or expired coupon code')
    } finally {
      setCouponLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center px-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-100">
            <ShoppingBag className="h-12 w-12 text-ink-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Your cart is empty</h2>
            <p className="mt-2 text-ink-500">Looks like you haven&apos;t added anything yet.</p>
          </div>
          <Link href="/products" className="btn-primary">
            Start Shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-ink-500">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink-900 font-medium">Cart</span>
          </nav>

          <h1 className="mb-8 text-2xl font-bold text-ink-900">
            My Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h1>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {items.map(({ product, quantity }) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="card p-4 flex gap-4"
                  >
                    {/* Image */}
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-100">
                      <Image
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop'}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/products/${product.slug}`}
                            className="text-sm font-semibold text-ink-900 hover:text-primary-600 line-clamp-2"
                          >
                            {product.name}
                          </Link>
                          {product.category && (
                            <p className="text-xs text-ink-400 mt-0.5">{product.category.name}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="shrink-0 rounded-lg p-1.5 text-ink-400 transition-all hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity controls */}
                        <div className="flex items-center rounded-lg border border-surface-200 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center text-ink-500 hover:bg-surface-100 disabled:opacity-40"
                            disabled={quantity <= 1}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center text-ink-500 hover:bg-surface-100 disabled:opacity-40"
                            disabled={quantity >= product.stock}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <span className="text-sm font-bold text-ink-900">
                          {formatCurrency(product.price * quantity)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <button
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-700 font-medium mt-2"
              >
                Clear all items
              </button>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24 space-y-5">
                <h2 className="text-base font-semibold text-ink-900">Order Summary</h2>

                {/* Coupon */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        type="text"
                        placeholder="WELCOME20"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                        disabled={!!discount}
                        className={cn('input-base pl-9', discount && 'bg-green-50 border-green-300 text-green-800')}
                      />
                    </div>
                    {discount ? (
                      <button
                        onClick={() => { setDiscount(null); setCoupon('') }}
                        className="btn-secondary text-sm px-3 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !coupon.trim()}
                        className="btn-secondary text-sm px-3 disabled:opacity-50"
                      >
                        {couponLoading ? '…' : 'Apply'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-ink-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal())}</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount ({discount.code})</span>
                      <span>-{formatCurrency(discount.amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-ink-600">
                    <span>Shipping</span>
                    <span className={SHIPPING === 0 ? 'text-green-600 font-medium' : ''}>
                      {SHIPPING === 0 ? 'FREE' : formatCurrency(SHIPPING)}
                    </span>
                  </div>
                  {SHIPPING > 0 && (
                    <p className="text-xs text-ink-400">
                      Add {formatCurrency(200 - subtotal())} more for free shipping
                    </p>
                  )}
                  <div className="border-t border-surface-200 pt-2.5 flex justify-between font-bold text-ink-900 text-base">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <Link href="/checkout" className="btn-primary w-full justify-center py-3">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link href="/products" className="block text-center text-sm text-ink-400 hover:text-primary-600">
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
