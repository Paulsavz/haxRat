'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Circle, Package, Truck, Home, ClipboardCheck, Loader2, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ordersApi } from '@/lib/api'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

const STATUS_STEPS: { id: OrderStatus; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'placed',
    label: 'Order Placed',
    desc: 'Your order has been received',
    icon: <ClipboardCheck className="h-5 w-5" />,
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    desc: 'Order confirmed by our team',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    id: 'processing',
    label: 'Processing',
    desc: 'Your items are being packed',
    icon: <Package className="h-5 w-5" />,
  },
  {
    id: 'shipped',
    label: 'Shipped',
    desc: 'On its way to you',
    icon: <Truck className="h-5 w-5" />,
  },
  {
    id: 'delivered',
    label: 'Delivered',
    desc: 'Package delivered successfully',
    icon: <Home className="h-5 w-5" />,
  },
]

function getStepIndex(status: OrderStatus): number {
  return STATUS_STEPS.findIndex((s) => s.id === status)
}

interface Props {
  orderId: string
}

export default function OrderDetailClient({ orderId }: Props) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ordersApi
      .getById(orderId)
      .then(setOrder)
      .catch(() => setError('Order not found'))
      .finally(() => setLoading(false))
  }, [orderId])

  // Subscribe to Supabase Realtime for live status updates
  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: payload.new.status as OrderStatus,
                  updated_at: payload.new.updated_at,
                }
              : prev
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <p className="text-ink-600">{error || 'Order not found'}</p>
        <Link href="/products" className="btn-primary mt-4">Continue Shopping</Link>
      </div>
    )
  }

  const currentStepIndex = getStepIndex(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="space-y-6 animate-in">
      {/* Confirmation banner */}
      <div className="card bg-gradient-to-r from-green-50 to-primary-50 border-green-200 p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-ink-900">Order Confirmed!</h1>
        <p className="mt-1 text-sm text-ink-600">
          Thank you for your order. We&apos;ll send updates to your phone.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-ink-700 shadow-sm border border-surface-200">
          Order #{orderId.slice(0, 8).toUpperCase()}
        </div>
      </div>

      {/* Status stepper */}
      {!isCancelled && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-ink-900">Order Status</h2>
            <span className="text-xs text-ink-400">
              Updated {formatDate(order.updated_at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="mt-6 relative">
            {/* Progress bar */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-surface-200" />
            <motion.div
              className="absolute left-5 top-5 w-0.5 bg-primary-600 origin-top"
              initial={{ scaleY: 0 }}
              animate={{
                scaleY: currentStepIndex / (STATUS_STEPS.length - 1),
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />

            <div className="space-y-6">
              {STATUS_STEPS.map((s, i) => {
                const done = i <= currentStepIndex
                const active = i === currentStepIndex

                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 relative z-10"
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                        done
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-surface-300 bg-white text-ink-400'
                      )}
                    >
                      {done && i < currentStepIndex ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        s.icon
                      )}
                    </div>

                    <div className="pt-1.5">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          done ? 'text-ink-900' : 'text-ink-400'
                        )}
                      >
                        {s.label}
                        {active && (
                          <span className="ml-2 badge bg-primary-100 text-primary-700 text-[10px] animate-pulse">
                            Current
                          </span>
                        )}
                      </p>
                      <p
                        className={cn(
                          'text-xs mt-0.5',
                          done ? 'text-ink-500' : 'text-ink-300'
                        )}
                      >
                        {s.desc}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="card border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700">This order was cancelled.</p>
        </div>
      )}

      {/* Items */}
      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink-900">
          Items ({order.items?.length || 0})
        </h2>
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-100">
                <Image
                  src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=128&h=128&fit=crop'}
                  alt={item.product?.name || 'Product'}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">
                  {item.product?.name}
                </p>
                <p className="text-xs text-ink-500 mt-0.5">
                  {formatCurrency(item.unit_price)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-ink-900">
                {formatCurrency(item.total_price)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-surface-200 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-ink-600">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-600">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? 'Free' : formatCurrency(order.shipping)}</span>
          </div>
          <div className="flex justify-between font-bold text-ink-900 text-base pt-1 border-t border-surface-200">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      {order.address && (
        <div className="card p-6">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Delivery Address</h2>
          <div className="flex items-start gap-3">
            <Home className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
            <div className="text-sm text-ink-600 space-y-0.5">
              <p className="font-medium text-ink-900">{order.address.full_name}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>{order.address.city}, {order.address.region}</p>
              <p>{order.address.phone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/products" className="btn-primary flex-1 justify-center py-3">
          Continue Shopping
        </Link>
        <Link href="/profile" className="btn-secondary flex-1 justify-center py-3">
          <ExternalLink className="h-4 w-4" />
          View All Orders
        </Link>
      </div>
    </div>
  )
}
