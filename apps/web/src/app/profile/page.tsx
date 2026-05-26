'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  Package,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
  Loader2,
  Plus,
  ExternalLink,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/lib/api'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Order } from '@/types'
import toast from 'react-hot-toast'

type Tab = 'orders' | 'addresses' | 'account'

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut, loading: authLoading } = useAuthStore()
  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
    if (user) {
      setDisplayName(user.user_metadata?.full_name || '')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      ordersApi.list().then(setOrders).catch(console.error).finally(() => setOrdersLoading(false))
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    toast.success('Signed out')
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </main>
        <Footer />
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'orders', label: 'My Orders', icon: <Package className="h-4 w-4" /> },
    { id: 'addresses', label: 'Addresses', icon: <MapPin className="h-4 w-4" /> },
    { id: 'account', label: 'Account', icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="card p-5">
                {/* Avatar */}
                <div className="mb-5 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
                    {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink-900">
                    {user.user_metadata?.full_name || 'My Account'}
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5 truncate max-w-full">
                    {user.email || user.phone}
                  </p>
                </div>

                {/* Nav */}
                <nav className="space-y-1">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                        tab === t.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-ink-600 hover:bg-surface-100'
                      )}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}

                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 mt-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Orders tab */}
                {tab === 'orders' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-ink-900">My Orders</h2>

                    {ordersLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="card p-12 text-center">
                        <Package className="mx-auto h-10 w-10 text-ink-300 mb-3" />
                        <p className="text-ink-600 font-medium">No orders yet</p>
                        <p className="text-sm text-ink-400 mt-1">Start shopping to see your orders here</p>
                        <Link href="/products" className="btn-primary mt-5">
                          Shop Now
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <Link
                            key={order.id}
                            href={`/orders/${order.id}`}
                            className="card p-4 flex items-center justify-between hover:shadow-card-hover transition-shadow"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-ink-900">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span className={cn('badge text-xs', STATUS_COLORS[order.status] || 'bg-surface-200 text-ink-600')}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-xs text-ink-500">
                                {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} ·{' '}
                                {formatDate(order.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-ink-900">
                                {formatCurrency(order.total)}
                              </span>
                              <ChevronRight className="h-4 w-4 text-ink-400" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Addresses tab */}
                {tab === 'addresses' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-ink-900">My Addresses</h2>
                      <button className="btn-secondary text-sm">
                        <Plus className="h-4 w-4" />
                        Add Address
                      </button>
                    </div>

                    <div className="card p-8 text-center text-ink-500">
                      <MapPin className="mx-auto h-10 w-10 text-ink-300 mb-3" />
                      <p className="text-sm">No saved addresses</p>
                      <p className="text-xs text-ink-400 mt-1">
                        Your addresses will be saved after your first order
                      </p>
                    </div>
                  </div>
                )}

                {/* Account tab */}
                {tab === 'account' && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold text-ink-900">Account Settings</h2>

                    <div className="card p-6 space-y-5">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink-700">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="input-base"
                          placeholder="Your name"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink-700">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.email || ''}
                          readOnly
                          className="input-base bg-surface-50 cursor-not-allowed"
                        />
                      </div>

                      {user.phone && (
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-ink-700">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={user.phone}
                            readOnly
                            className="input-base bg-surface-50 cursor-not-allowed"
                          />
                        </div>
                      )}

                      <button
                        disabled={savingProfile}
                        onClick={async () => {
                          setSavingProfile(true)
                          try {
                            await import('@/lib/supabase').then(({ supabase }) =>
                              supabase.auth.updateUser({ data: { full_name: displayName } })
                            )
                            toast.success('Profile updated!')
                          } catch {
                            toast.error('Failed to update profile')
                          } finally {
                            setSavingProfile(false)
                          }
                        }}
                        className="btn-primary"
                      >
                        {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Save Changes
                      </button>
                    </div>

                    {/* Danger zone */}
                    <div className="card border-red-200 p-6">
                      <h3 className="text-sm font-semibold text-red-700 mb-2">Danger Zone</h3>
                      <p className="text-xs text-ink-500 mb-4">
                        Once you delete your account, all your data will be permanently removed.
                      </p>
                      <button className="btn-secondary border-red-200 text-red-600 hover:bg-red-50 text-sm">
                        Delete Account
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
