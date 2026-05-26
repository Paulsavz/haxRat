'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  MessageSquare,
  Phone,
  Video,
  RefreshCw,
  ChevronDown,
  Package,
  MapPin,
  Clock,
  User,
} from 'lucide-react'
import { api } from '@/lib/api'
import {
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
  ORDER_STATUS_COLORS,
  ORDER_STATUSES,
  type OrderStatus,
} from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Tabs from '@/components/ui/Tabs'
import Avatar from '@/components/ui/Avatar'
import { SlideOver } from '@/components/ui/Modal'
import { useAdminStore } from '@/store/adminStore'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface OrderItem {
  id: string
  product_name: string
  product_image?: string
  quantity: number
  unit_price: number
  total: number
}

interface StatusHistory {
  status: OrderStatus
  timestamp: string
  note?: string
}

interface Order {
  id: string
  order_number: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_avatar?: string
  items: OrderItem[]
  items_count: number
  subtotal: number
  delivery_fee: number
  total: number
  status: OrderStatus
  delivery_address: string
  created_at: string
  status_history: StatusHistory[]
  notes?: string
}

const statusVariantMap: Record<OrderStatus, 'info' | 'default' | 'warning' | 'purple' | 'success' | 'danger'> = {
  placed: 'info',
  confirmed: 'default',
  processing: 'warning',
  shipped: 'purple',
  delivered: 'success',
  cancelled: 'danger',
}

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

// Mock orders data
const generateMockOrders = (): Order[] =>
  Array.from({ length: 20 }, (_, i) => {
    const statuses = ORDER_STATUSES
    const status = statuses[i % statuses.length]
    return {
      id: `order-${i + 1}`,
      order_number: `ORD-${String(i + 1).padStart(4, '0')}`,
      customer_id: `cust-${i + 1}`,
      customer_name: ['Kwame Asante', 'Ama Boateng', 'Kofi Mensah', 'Abena Osei', 'Yaw Darko'][i % 5],
      customer_email: `customer${i + 1}@example.com`,
      customer_phone: `+233 24 ${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
      items: [
        { id: `item-${i}-1`, product_name: 'Product A', quantity: 2, unit_price: 120, total: 240 },
        { id: `item-${i}-2`, product_name: 'Product B', quantity: 1, unit_price: 80, total: 80 },
      ],
      items_count: 3,
      subtotal: 320,
      delivery_fee: 20,
      total: 340,
      status,
      delivery_address: '123 Accra Road, Kumasi, Ghana',
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      status_history: [
        { status: 'placed', timestamp: new Date(Date.now() - i * 3600000 - 3600000).toISOString() },
        ...(status !== 'placed' ? [{ status: 'confirmed' as OrderStatus, timestamp: new Date(Date.now() - i * 3600000).toISOString() }] : []),
      ],
    }
  })

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const { streamChatClient, streamVideoClient, admin } = useAdminStore()

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getOrders({
        status: activeTab === 'all' ? '' : activeTab,
        search,
      })
      setOrders(res.data.orders || res.data)
    } catch {
      setOrders(generateMockOrders())
    } finally {
      setLoading(false)
    }
  }, [activeTab, search])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter((order) => {
    const matchStatus = activeTab === 'all' || order.status === activeTab
    const matchSearch =
      !search ||
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true)
    try {
      await api.updateOrderStatus(orderId, newStatus)
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                status_history: [
                  ...o.status_history,
                  { status: newStatus, timestamp: new Date().toISOString() },
                ],
              }
            : o
        )
      )
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                status_history: [
                  ...prev.status_history,
                  { status: newStatus, timestamp: new Date().toISOString() },
                ],
              }
            : null
        )
      }
      toast.success(`Order status updated to ${newStatus}`)
    } catch {
      toast.error('Failed to update order status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleMessageCustomer = async (order: Order) => {
    if (!streamChatClient) {
      toast.error('Chat not connected')
      return
    }
    try {
      const channelId = `support_${order.customer_id}`
      const channel = streamChatClient.channel('messaging', channelId, {
        members: [admin!.id, order.customer_id],
        name: `Support: ${order.customer_name}`,
      })
      await channel.watch()
      toast.success(`Opening chat with ${order.customer_name}`)
      window.location.href = '/chat'
    } catch {
      toast.error('Failed to open chat')
    }
  }

  const handleCallCustomer = async (order: Order, type: 'audio' | 'video') => {
    if (!streamVideoClient) {
      toast.error('Video client not connected')
      return
    }
    try {
      const callId = `${type}_${order.customer_id}_${Date.now()}`
      const call = streamVideoClient.call(type === 'video' ? 'default' : 'audio_room', callId)
      await call.getOrCreate({
        ring: true,
        data: {
          members: [{ user_id: admin!.id }, { user_id: order.customer_id }],
        },
      })
      useAdminStore.getState().setActiveCall({ call, callType: type })
      window.location.href = '/calls'
    } catch {
      toast.error(`Failed to start ${type} call`)
    }
  }

  const tabs = [
    { id: 'all', label: 'All', count: orders.length },
    { id: 'placed', label: 'Placed', count: orders.filter((o) => o.status === 'placed').length },
    { id: 'confirmed', label: 'Confirmed', count: orders.filter((o) => o.status === 'confirmed').length },
    { id: 'processing', label: 'Processing', count: orders.filter((o) => o.status === 'processing').length },
    { id: 'shipped', label: 'Shipped', count: orders.filter((o) => o.status === 'shipped').length },
    { id: 'delivered', label: 'Delivered', count: orders.filter((o) => o.status === 'delivered').length },
    { id: 'cancelled', label: 'Cancelled', count: orders.filter((o) => o.status === 'cancelled').length },
  ]

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{orders.length} total orders</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={fetchOrders}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        <div className="px-4 pt-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <div className="p-4 border-t border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading orders...
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5 text-sm font-mono font-semibold text-gray-900">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={order.customer_name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                            <p className="text-xs text-gray-400">{order.customer_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">
                        {order.items_count}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div onClick={(e) => e.stopPropagation()}>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusUpdate(order.id, e.target.value as OrderStatus)
                            }
                            className={cn(
                              'text-xs font-medium rounded-full px-2.5 py-0.5 border-0',
                              'focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer',
                              ORDER_STATUS_COLORS[order.status].bg,
                              ORDER_STATUS_COLORS[order.status].text
                            )}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">
                        {formatRelativeTime(order.created_at)}
                      </td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleMessageCustomer(order)}
                            title="Message customer"
                            className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCallCustomer(order, 'audio')}
                            title="Audio call"
                            className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCallCustomer(order, 'video')}
                            title="Video call"
                            className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Video className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Slide-over */}
      <SlideOver
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order ${selectedOrder.order_number}` : ''}
        width="xl"
      >
        {selectedOrder && (
          <div className="p-6 space-y-6">
            {/* Customer info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Customer
              </p>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={selectedOrder.customer_name} size="md" />
                <div>
                  <p className="font-semibold text-gray-900">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customer_email}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customer_phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span>{selectedOrder.delivery_address}</span>
              </div>
            </div>

            {/* Current status + actions */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Status
              </p>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={statusVariantMap[selectedOrder.status]} dot>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </Badge>
              </div>
              {STATUS_TRANSITIONS[selectedOrder.status].length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {STATUS_TRANSITIONS[selectedOrder.status].map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      variant={nextStatus === 'cancelled' ? 'danger' : 'primary'}
                      size="sm"
                      loading={updatingStatus}
                      onClick={() => handleStatusUpdate(selectedOrder.id, nextStatus)}
                    >
                      Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Items ({selectedOrder.items_count})
              </p>
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-gray-200 flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                ))}
              </div>
              {/* Order totals */}
              <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery fee</span>
                  <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Status timeline */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Status History
              </p>
              <div className="space-y-3">
                {selectedOrder.status_history.map((entry, idx) => (
                  <div key={idx} className="relative flex items-start gap-3 timeline-item pl-1">
                    <div
                      className={cn(
                        'h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-white',
                        ORDER_STATUS_COLORS[entry.status].dot
                      )}
                    >
                      <Clock className="w-2.5 h-2.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {entry.status}
                      </p>
                      <p className="text-xs text-gray-400">{formatDateTime(entry.timestamp)}</p>
                      {entry.note && (
                        <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Communication */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Contact Customer
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<MessageSquare className="w-4 h-4" />}
                  onClick={() => handleMessageCustomer(selectedOrder)}
                >
                  Message
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Phone className="w-4 h-4" />}
                  onClick={() => handleCallCustomer(selectedOrder, 'audio')}
                >
                  Audio Call
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Video className="w-4 h-4" />}
                  onClick={() => handleCallCustomer(selectedOrder, 'video')}
                >
                  Video Call
                </Button>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}
