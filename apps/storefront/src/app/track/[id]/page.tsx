'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Package, CheckCircle, Circle, MessageCircle, MapPin,
  ArrowLeft, Clock, Truck, Home,
} from 'lucide-react';
import { ordersApi } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import { formatCurrency, formatDate, formatDateAbsolute, cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';
import { OrderStatusBadge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useChatStore } from '../../../store/chatStore';
import type { Order, OrderStatus } from '../../../types';

// ─── Timeline Step ────────────────────────────────────────────────────────────

const STATUS_STEPS: { key: OrderStatus; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'placed',     label: 'Order Placed',  icon: Package,      desc: 'Your order has been received.' },
  { key: 'confirmed',  label: 'Confirmed',     icon: CheckCircle,  desc: 'We\'ve confirmed your order details.' },
  { key: 'processing', label: 'Processing',    icon: Clock,        desc: 'Your order is being prepared.' },
  { key: 'shipped',    label: 'Shipped',       icon: Truck,        desc: 'Your order is on its way!' },
  { key: 'delivered',  label: 'Delivered',     icon: Home,         desc: 'Order delivered successfully.' },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  placed: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4, cancelled: -1,
};

function TimelineStep({
  step,
  isDone,
  isActive,
  timestamp,
  isLast,
}: {
  step: typeof STATUS_STEPS[0];
  isDone: boolean;
  isActive: boolean;
  timestamp?: string;
  isLast: boolean;
}) {
  const Icon = step.icon;
  return (
    <div className="flex gap-4">
      {/* Icon + Line */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all',
          isDone || isActive
            ? 'bg-primary-600 border-primary-600 text-white shadow-md'
            : 'bg-white border-gray-200 text-ink-faint'
        )}>
          {isDone ? <CheckCircle size={18} /> : <Icon size={18} />}
        </div>
        {!isLast && (
          <div className={cn(
            'w-0.5 flex-1 mt-1 min-h-[2rem] transition-colors',
            isDone ? 'bg-primary-400' : 'bg-gray-200'
          )} />
        )}
      </div>

      {/* Text */}
      <div className={cn('pb-6', isLast && 'pb-0')}>
        <p className={cn(
          'font-semibold text-sm',
          isDone || isActive ? 'text-ink' : 'text-ink-faint'
        )}>
          {step.label}
          {isActive && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary-600 font-medium">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
              Current
            </span>
          )}
        </p>
        <p className="text-xs text-ink-muted mt-0.5">{step.desc}</p>
        {timestamp && (
          <p className="text-xs text-ink-faint mt-1 flex items-center gap-1">
            <Clock size={11} /> {formatDateAbsolute(timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  params: { id: string };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackOrderPage({ params }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const openChat = useChatStore((s) => s.openChat);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    ordersApi.get(params.id)
      .then((res) => {
        setOrder(res.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [params.id]);

  // ── Realtime Subscription ──────────────────────────────────────────────────

  useEffect(() => {
    if (!params.id) return;

    const channel = supabase
      .channel(`order-track-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${params.id}`,
        },
        (payload) => {
          setOrder((prev) => prev ? { ...prev, ...payload.new as Partial<Order> } : prev);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_status_history',
          filter: `order_id=eq.${params.id}`,
        },
        (payload) => {
          setOrder((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status_history: [
                ...(prev.status_history ?? []),
                payload.new as any,
              ],
            };
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-32" rounded="rounded-3xl" />
        <Skeleton className="h-80" rounded="rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">😕</p>
        <h1 className="text-xl font-semibold text-ink mb-4">Order not found</h1>
        <Link href="/profile"><Button>My Orders</Button></Link>
      </div>
    );
  }

  const currentStepIdx = STATUS_ORDER[order.status] ?? 0;
  const isCancelled = order.status === 'cancelled';

  const getTimestampForStatus = (status: OrderStatus): string | undefined => {
    return order.status_history
      ?.filter((h) => h.status === status)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      ?.created_at;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back */}
      <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> My Orders
      </Link>

      {/* Header */}
      <div className="bg-white rounded-3xl shadow-soft p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-ink-muted font-medium uppercase tracking-wider">Order</p>
            <p className="text-2xl font-display font-bold text-ink font-mono mt-0.5">
              #{order.order_number}
            </p>
            <p className="text-sm text-ink-muted mt-1">
              Placed {formatDate(order.created_at)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {order.estimated_delivery && !isCancelled && (
          <div className="mt-4 p-3 bg-primary-50 rounded-2xl flex items-center gap-2 text-sm text-primary-700">
            <Truck size={16} className="flex-shrink-0" />
            <span>Estimated delivery: <strong>{formatDate(order.estimated_delivery)}</strong></span>
          </div>
        )}
      </div>

      {/* Timeline */}
      {!isCancelled ? (
        <div className="bg-white rounded-3xl shadow-soft p-6">
          <h2 className="text-base font-semibold text-ink mb-6">Order Timeline</h2>
          <div className="pl-2">
            {STATUS_STEPS.map((step, i) => (
              <TimelineStep
                key={step.key}
                step={step}
                isDone={currentStepIdx > i}
                isActive={currentStepIdx === i}
                timestamp={getTimestampForStatus(step.key)}
                isLast={i === STATUS_STEPS.length - 1}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center">
          <p className="text-2xl mb-2">❌</p>
          <h2 className="font-semibold text-red-700">Order Cancelled</h2>
          <p className="text-sm text-red-600 mt-1">
            This order has been cancelled. Contact support if you have any questions.
          </p>
        </div>
      )}

      {/* Map placeholder */}
      {order.status === 'shipped' && (
        <div className="bg-white rounded-3xl shadow-soft p-6">
          <h2 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-primary-500" /> Live Tracking
          </h2>
          <div className="aspect-video bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
              <Truck size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-700">Your order is on the way!</p>
              <p className="text-xs text-primary-600 mt-0.5">Live map tracking coming soon</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-white rounded-3xl shadow-soft p-6">
        <h2 className="text-base font-semibold text-ink mb-4">Items Ordered</h2>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.product_image ? (
                <img src={item.product_image} alt={item.product_name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center text-xl flex-shrink-0">📦</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink line-clamp-1">{item.product_name}</p>
                <p className="text-xs text-ink-muted">x{item.quantity} · {formatCurrency(item.unit_price)} each</p>
              </div>
              <p className="text-sm font-bold text-ink">{formatCurrency(item.total_price)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Delivery</span>
            <span>{order.delivery_fee === 0 ? 'FREE' : formatCurrency(order.delivery_fee)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span><span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-ink border-t border-gray-100 pt-2">
            <span>Total</span><span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <Button
        fullWidth
        variant="outline"
        size="lg"
        leftIcon={<MessageCircle size={16} />}
        onClick={openChat}
      >
        Chat with Support
      </Button>
    </div>
  );
}
