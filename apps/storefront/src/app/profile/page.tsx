'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Package, MapPin, LogOut, ChevronRight,
  Phone, Mail, Plus, Trash2, CheckCircle,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ordersApi, authApi } from '../../lib/api';
import { formatCurrency, formatDate, initials, cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { OrderRowSkeleton } from '../../components/ui/Skeleton';
import type { Order, Address } from '../../types';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'orders',    label: 'Orders',    icon: Package },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'account',   label: 'Account',   icon: User },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { session, user, logout } = useAuthStore();
  const [tab, setTab] = useState<'orders' | 'addresses' | 'account'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingAddr, setIsLoadingAddr] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);

  useEffect(() => {
    ordersApi.myOrders()
      .then((res) => {
        setOrders(res.data);
        setIsLoadingOrders(false);
      })
      .catch(() => setIsLoadingOrders(false));

    authApi.addresses()
      .then((res) => {
        setAddresses(res.data);
        setIsLoadingAddr(false);
      })
      .catch(() => setIsLoadingAddr(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await authApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!session) return null;

  const displayName = user?.name ?? session.user?.email ?? 'Guest';
  const displayInitials = initials(displayName);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile header */}
      <div className="bg-white rounded-3xl shadow-soft p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {displayInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold text-ink">{displayName}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {user?.phone && (
                <span className="flex items-center gap-1 text-sm text-ink-muted">
                  <Phone size={13} /> {user.phone}
                </span>
              )}
              {session.user?.email && (
                <span className="flex items-center gap-1 text-sm text-ink-muted">
                  <Mail size={13} /> {session.user.email}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<LogOut size={15} />}
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-muted p-1 rounded-2xl mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              tab === id
                ? 'bg-white text-ink shadow-soft'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <Icon size={15} />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Orders */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {isLoadingOrders ? (
            Array.from({ length: 3 }).map((_, i) => <OrderRowSkeleton key={i} />)
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <Package size={48} className="mx-auto text-ink-faint mb-4" />
              <h2 className="text-lg font-semibold text-ink mb-2">No orders yet</h2>
              <p className="text-ink-muted text-sm mb-6">Start shopping to see your orders here.</p>
              <Link href="/products"><Button>Shop Now</Button></Link>
            </div>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/order-confirmation/${order.id}`}
                className="block bg-white rounded-2xl shadow-soft p-4 hover:shadow-card transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package size={22} className="text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-bold text-ink font-mono">#{order.order_number}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''} ·{' '}
                      <strong>{formatCurrency(order.total)}</strong>
                    </p>
                    <p className="text-xs text-ink-faint">{formatDate(order.created_at)}</p>
                  </div>
                  <ChevronRight size={18} className="text-ink-faint flex-shrink-0" />
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Tab: Addresses */}
      {tab === 'addresses' && (
        <div className="space-y-3">
          {isLoadingAddr ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-soft animate-pulse h-28" />
            ))
          ) : (
            <>
              {addresses.map((addr) => (
                <div key={addr.id} className="bg-white rounded-2xl shadow-soft p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-ink text-sm">{addr.name}</p>
                          {addr.is_default && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle size={11} /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-ink-muted mt-0.5">{addr.phone}</p>
                        <p className="text-sm text-ink-muted">
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}
                          {addr.region ? `, ${addr.region}` : ''}
                        </p>
                        <p className="text-sm text-ink-muted">{addr.country}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              <button className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-5 flex items-center justify-center gap-2 text-sm text-ink-muted hover:border-primary-400 hover:text-primary-600 transition-colors">
                <Plus size={16} /> Add New Address
              </button>
            </>
          )}
        </div>
      )}

      {/* Tab: Account */}
      {tab === 'account' && (
        <div className="bg-white rounded-3xl shadow-soft p-6 space-y-5">
          <h2 className="text-base font-semibold text-ink">Account Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Name</label>
              <p className="mt-1 text-sm font-semibold text-ink">{user?.name ?? '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Phone</label>
              <p className="mt-1 text-sm font-semibold text-ink">{user?.phone ?? '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Email</label>
              <p className="mt-1 text-sm font-semibold text-ink">{session.user?.email ?? '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Member Since</label>
              <p className="mt-1 text-sm font-semibold text-ink">{formatDate(user?.created_at ?? session.user?.created_at ?? '')}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <Button
              variant="danger"
              leftIcon={<LogOut size={15} />}
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
