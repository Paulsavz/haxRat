'use client'

import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  DollarSign,
  MessageSquare,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { formatCurrency, formatRelativeTime, ORDER_STATUS_COLORS, type OrderStatus } from '@/lib/utils'
import Card, { StatCard } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import Avatar from '@/components/ui/Avatar'
import { useAdminStore } from '@/store/adminStore'
import toast from 'react-hot-toast'

interface DashboardStats {
  ordersToday: number
  revenueToday: number
  activeChats: number
  pendingOrders: number
  totalCustomers: number
  ordersTodayChange: number
  revenueTodayChange: number
}

interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

interface RecentOrder {
  id: string
  order_number: string
  customer_name: string
  customer_avatar?: string
  total: number
  status: OrderStatus
  created_at: string
  items_count: number
}

interface ActiveChannel {
  id: string
  customer_name: string
  customer_avatar?: string
  last_message: string
  last_message_at: string
  unread_count: number
}

// Mock data for development
const mockStats: DashboardStats = {
  ordersToday: 47,
  revenueToday: 8340.5,
  activeChats: 12,
  pendingOrders: 23,
  totalCustomers: 2841,
  ordersTodayChange: 12,
  revenueTodayChange: 8.3,
}

const mockRevenue: RevenueDataPoint[] = [
  { date: 'Mon', revenue: 4200, orders: 28 },
  { date: 'Tue', revenue: 5800, orders: 35 },
  { date: 'Wed', revenue: 3900, orders: 24 },
  { date: 'Thu', revenue: 7200, orders: 42 },
  { date: 'Fri', revenue: 9100, orders: 58 },
  { date: 'Sat', revenue: 11200, orders: 73 },
  { date: 'Sun', revenue: 8340, orders: 47 },
]

const mockOrders: RecentOrder[] = [
  { id: '1', order_number: 'ORD-001', customer_name: 'Kwame Asante', total: 340, status: 'placed', created_at: new Date(Date.now() - 5 * 60000).toISOString(), items_count: 3 },
  { id: '2', order_number: 'ORD-002', customer_name: 'Ama Boateng', total: 120, status: 'confirmed', created_at: new Date(Date.now() - 15 * 60000).toISOString(), items_count: 1 },
  { id: '3', order_number: 'ORD-003', customer_name: 'Kofi Mensah', total: 780, status: 'processing', created_at: new Date(Date.now() - 30 * 60000).toISOString(), items_count: 5 },
  { id: '4', order_number: 'ORD-004', customer_name: 'Abena Osei', total: 250, status: 'shipped', created_at: new Date(Date.now() - 2 * 3600000).toISOString(), items_count: 2 },
  { id: '5', order_number: 'ORD-005', customer_name: 'Yaw Darko', total: 95, status: 'delivered', created_at: new Date(Date.now() - 4 * 3600000).toISOString(), items_count: 1 },
  { id: '6', order_number: 'ORD-006', customer_name: 'Efua Ansah', total: 560, status: 'placed', created_at: new Date(Date.now() - 6 * 3600000).toISOString(), items_count: 4 },
  { id: '7', order_number: 'ORD-007', customer_name: 'Nana Adjei', total: 180, status: 'cancelled', created_at: new Date(Date.now() - 8 * 3600000).toISOString(), items_count: 2 },
]

const statusVariantMap: Record<OrderStatus, 'info' | 'default' | 'warning' | 'purple' | 'success' | 'danger'> = {
  placed: 'info',
  confirmed: 'default',
  processing: 'warning',
  shipped: 'purple',
  delivered: 'success',
  cancelled: 'danger',
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-brand-600">
        {formatCurrency(payload[0]?.value || 0)}
      </p>
      <p className="text-xs text-gray-500">{payload[1]?.value || 0} orders</p>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenue, setRevenue] = useState<RevenueDataPoint[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const { streamChatClient, setPendingOrdersCount } = useAdminStore()

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, revenueRes, ordersRes] = await Promise.allSettled([
          api.getDashboardStats(),
          api.getRevenueChart(),
          api.getRecentOrders(),
        ])

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data)
          setPendingOrdersCount(statsRes.value.data.pendingOrders)
        } else {
          // Use mock data for development
          setStats(mockStats)
          setPendingOrdersCount(mockStats.pendingOrders)
        }

        if (revenueRes.status === 'fulfilled') {
          setRevenue(revenueRes.value.data)
        } else {
          setRevenue(mockRevenue)
        }

        if (ordersRes.status === 'fulfilled') {
          setRecentOrders(ordersRes.value.data)
        } else {
          setRecentOrders(mockOrders)
        }
      } catch {
        setStats(mockStats)
        setRevenue(mockRevenue)
        setRecentOrders(mockOrders)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [setPendingOrdersCount])

  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  return (
    <div className="p-6 space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          View all orders <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Orders Today"
              value={stats?.ordersToday ?? 0}
              icon={<ShoppingCart className="h-5 w-5 text-brand-600" />}
              iconBg="bg-brand-50"
              change={{ value: stats?.ordersTodayChange ?? 0, label: 'vs yesterday' }}
            />
            <StatCard
              title="Revenue Today"
              value={formatCurrency(stats?.revenueToday ?? 0)}
              icon={<DollarSign className="h-5 w-5 text-green-600" />}
              iconBg="bg-green-50"
              change={{ value: stats?.revenueTodayChange ?? 0, label: 'vs yesterday' }}
            />
            <StatCard
              title="Active Chats"
              value={stats?.activeChats ?? 0}
              icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-50"
            />
            <StatCard
              title="Pending Orders"
              value={stats?.pendingOrders ?? 0}
              icon={<Clock className="h-5 w-5 text-yellow-600" />}
              iconBg="bg-yellow-50"
            />
            <StatCard
              title="Total Customers"
              value={(stats?.totalCustomers ?? 0).toLocaleString()}
              icon={<Users className="h-5 w-5 text-purple-600" />}
              iconBg="bg-purple-50"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue chart — takes 2/3 */}
        <Card className="xl:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-sm text-gray-500">Last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              +8.3% this week
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenue} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `GH₵${(v / 1000).toFixed(0)}k`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#4f46e5', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick stats — takes 1/3 */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Order Status Split</h2>
          <div className="space-y-3">
            {(Object.entries({
              placed: 14,
              confirmed: 8,
              processing: 9,
              shipped: 16,
              delivered: 120,
              cancelled: 5,
            }) as [OrderStatus, number][]).map(([status, count]) => {
              const colors = ORDER_STATUS_COLORS[status]
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className={`inline-flex h-2 w-2 rounded-full shrink-0 ${colors.dot}`} />
                  <span className="flex-1 text-sm text-gray-600 capitalize">{status}</span>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href="/orders"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Manage orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent orders */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
          <Link
            href="/orders"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Order', 'Customer', 'Items', 'Total', 'Status', 'Time'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {}}
                >
                  <td className="px-5 py-3.5 text-sm font-mono font-medium text-gray-900">
                    {order.order_number}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={order.customer_name} size="sm" />
                      <span className="text-sm text-gray-700 font-medium">
                        {order.customer_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={statusVariantMap[order.status]} dot>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {formatRelativeTime(order.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
