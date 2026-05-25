'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle, Package, MapPin, MessageCircle, LocateFixed,
  Printer, ArrowRight,
} from 'lucide-react';
import { ordersApi } from '../../../lib/api';
import { formatCurrency, formatDateAbsolute, cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';
import { OrderStatusBadge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useChatStore } from '../../../store/chatStore';
import type { Order } from '../../../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  params: { id: string };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderConfirmationPage({ params }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const openChat = useChatStore((s) => s.openChat);

  useEffect(() => {
    ordersApi.get(params.id)
      .then((res) => {
        setOrder(res.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-40" rounded="rounded-3xl" />
        <Skeleton className="h-60" rounded="rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">😕</p>
        <h1 className="text-xl font-semibold text-ink mb-4">Order not found</h1>
        <Link href="/"><Button>Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Success Banner */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl p-8 text-center border border-emerald-200">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-display font-bold text-emerald-800 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-emerald-700 text-sm mb-4">
          Thank you for your purchase. We've received your order and will begin processing it shortly.
        </p>
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3">
          <Package size={18} className="text-emerald-600" />
          <div className="text-left">
            <p className="text-xs text-emerald-600 font-medium">Order Number</p>
            <p className="text-lg font-bold text-emerald-900 font-mono">{order.order_number}</p>
          </div>
        </div>
      </div>

      {/* Status + Details */}
      <div className="bg-white rounded-3xl shadow-soft p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <p className="text-sm text-ink-muted">Placed on</p>
            <p className="font-semibold text-ink text-sm">{formatDateAbsolute(order.created_at)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Product</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Qty</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-surface-subtle transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center text-xl flex-shrink-0">📦</div>
                      )}
                      <div>
                        <p className="font-medium text-ink">{item.product_name}</p>
                        {item.variant && Object.keys(item.variant).length > 0 && (
                          <p className="text-xs text-ink-muted">
                            {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                          </p>
                        )}
                        <p className="text-xs text-ink-faint">{formatCurrency(item.unit_price)} each</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-semibold">{item.quantity}</td>
                  <td className="px-6 py-4 text-right font-bold">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Delivery Fee</span>
            <span>{order.delivery_fee === 0 ? 'FREE' : formatCurrency(order.delivery_fee)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-ink border-t border-gray-100 pt-2">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-white rounded-3xl shadow-soft p-6">
        <h2 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
          <MapPin size={16} className="text-primary-500" /> Delivery Address
        </h2>
        <div className="text-sm text-ink-muted space-y-1">
          <p className="font-semibold text-ink">{order.address.name}</p>
          <p>{order.address.phone}</p>
          <p>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</p>
          <p>{order.address.city}{order.address.region ? `, ${order.address.region}` : ''}</p>
          <p>{order.address.country}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={`/track/${order.id}`}>
          <Button fullWidth variant="primary" leftIcon={<LocateFixed size={16} />} size="lg">
            Track Order
          </Button>
        </Link>
        <Button
          fullWidth
          variant="outline"
          leftIcon={<MessageCircle size={16} />}
          size="lg"
          onClick={openChat}
        >
          Chat with us
        </Button>
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <Link href="/products" className="inline-flex items-center gap-1 text-primary-600 text-sm font-medium hover:text-primary-700">
          Continue Shopping <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
