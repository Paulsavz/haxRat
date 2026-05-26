'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Phone, Video, MessageSquare, ShoppingBag, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatRelativeTime, type OrderStatus } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { SlideOver } from '@/components/ui/Modal'
import { useAdminStore } from '@/store/adminStore'
import toast from 'react-hot-toast'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  avatar_url?: string
  orders_count: number
  total_spent: number
  last_order_at?: string
  created_at: string
  is_active: boolean
}

interface CustomerOrder {
  id: string
  order_number: string
  total: number
  status: OrderStatus
  created_at: string
  items_count: number
}

const mockCustomers: Customer[] = Array.from({ length: 15 }, (_, i) => ({
  id: `cust-${i + 1}`,
  name: ['Kwame Asante', 'Ama Boateng', 'Kofi Mensah', 'Abena Osei', 'Yaw Darko', 'Efua Ansah', 'Nana Adjei', 'Akua Poku'][i % 8],
  email: `customer${i + 1}@example.com`,
  phone: `+233 24 ${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
  orders_count: Math.floor(Math.random() * 20) + 1,
  total_spent: Math.floor(Math.random() * 5000) + 100,
  last_order_at: new Date(Date.now() - i * 86400000 * 2).toISOString(),
  created_at: new Date(Date.now() - (i + 30) * 86400000).toISOString(),
  is_active: i % 8 !== 0,
}))

const statusVariantMap: Record<OrderStatus, 'info' | 'default' | 'warning' | 'purple' | 'success' | 'danger'> = {
  placed: 'info',
  confirmed: 'default',
  processing: 'warning',
  shipped: 'purple',
  delivered: 'success',
  cancelled: 'danger',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const { streamChatClient, streamVideoClient, admin } = useAdminStore()

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    try {
      const res = await api.getCustomers()
      setCustomers(res.data.customers || res.data)
    } catch {
      setCustomers(mockCustomers)
    } finally {
      setLoading(false)
    }
  }

  const openCustomer = useCallback(async (customer: Customer) => {
    setSelectedCustomer(customer)
    setLoadingOrders(true)
    try {
      const res = await api.getCustomer(customer.id)
      setCustomerOrders(res.data.orders || [])
    } catch {
      // Mock orders
      setCustomerOrders([
        { id: '1', order_number: 'ORD-0023', total: 340, status: 'delivered', created_at: new Date(Date.now() - 86400000).toISOString(), items_count: 3 },
        { id: '2', order_number: 'ORD-0018', total: 120, status: 'cancelled', created_at: new Date(Date.now() - 7 * 86400000).toISOString(), items_count: 1 },
        { id: '3', order_number: 'ORD-0011', total: 780, status: 'delivered', created_at: new Date(Date.now() - 14 * 86400000).toISOString(), items_count: 5 },
      ])
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  const handleStartChat = async (customer: Customer) => {
    if (!streamChatClient || !admin) {
      toast.error('Chat not connected')
      return
    }
    try {
      const channel = streamChatClient.channel('messaging', `support_${customer.id}`, {
        members: [admin.id, customer.id],
        name: `Support: ${customer.name}`,
      })
      await channel.watch()
      toast.success(`Opening chat with ${customer.name}`)
      window.location.href = '/chat'
    } catch {
      toast.error('Failed to open chat')
    }
  }

  const handleCall = async (customer: Customer, type: 'audio' | 'video') => {
    if (!streamVideoClient || !admin) {
      toast.error('Video client not connected')
      return
    }
    try {
      const callId = `${type}_${customer.id}_${Date.now()}`
      const call = streamVideoClient.call(type === 'video' ? 'default' : 'audio_room', callId)
      await call.getOrCreate({
        ring: true,
        data: {
          members: [{ user_id: admin.id }, { user_id: customer.id }],
        },
      })
      useAdminStore.getState().setActiveCall({ call, callType: type })
      window.location.href = '/calls'
    } catch {
      toast.error(`Failed to start ${type} call`)
    }
  }

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  return (
    <div className="p-6 space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{customers.length} registered customers</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {/* Customers table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading customers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Customer', 'Phone', 'Orders', 'Total Spent', 'Last Order', 'Registered', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => openCustomer(customer)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.name} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                          <p className="text-xs text-gray-400">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{customer.phone}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-900">{customer.orders_count}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {customer.last_order_at ? formatRelativeTime(customer.last_order_at) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={customer.is_active ? 'success' : 'gray'}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartChat(customer)}
                          title="Message"
                          className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCall(customer, 'audio')}
                          title="Audio call"
                          className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCall(customer, 'video')}
                          title="Video call"
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer detail slide-over */}
      <SlideOver
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Profile"
        width="lg"
      >
        {selectedCustomer && (
          <div className="p-6 space-y-6">
            {/* Profile */}
            <div className="flex items-center gap-4">
              <Avatar name={selectedCustomer.name} size="xl" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedCustomer.name}</h3>
                <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                <Badge variant={selectedCustomer.is_active ? 'success' : 'gray'} className="mt-1">
                  {selectedCustomer.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{selectedCustomer.orders_count}</p>
                <p className="text-xs text-gray-500 mt-0.5">Orders</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(selectedCustomer.total_spent)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Spent</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-gray-900">
                  {selectedCustomer.last_order_at ? formatRelativeTime(selectedCustomer.last_order_at) : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Last Order</p>
              </div>
            </div>

            {/* Member since */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Member since {formatDate(selectedCustomer.created_at, 'MMMM d, yyyy')}
            </div>

            {/* Actions */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact</p>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<MessageSquare className="w-4 h-4" />}
                  onClick={() => handleStartChat(selectedCustomer)}
                >
                  Start Chat
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Phone className="w-4 h-4" />}
                  onClick={() => handleCall(selectedCustomer, 'audio')}
                >
                  Call
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Video className="w-4 h-4" />}
                  onClick={() => handleCall(selectedCustomer, 'video')}
                >
                  Video
                </Button>
              </div>
            </div>

            {/* Order history */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Order History
              </p>
              {loadingOrders ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No orders yet
                </div>
              ) : (
                <div className="space-y-2">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                      <div>
                        <p className="text-sm font-mono font-semibold text-gray-900">{order.order_number}</p>
                        <p className="text-xs text-gray-400">{formatRelativeTime(order.created_at)} · {order.items_count} items</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariantMap[order.status]}>
                          {order.status}
                        </Badge>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}
