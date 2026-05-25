import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  ShoppingCart,
  MessageSquare,
  Clock,
  Users,
  RefreshCw,
} from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import { StatCard } from '@/components/ui/Card';
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface Stats {
  revenueToday: number;
  ordersToday: number;
  activeChats: number;
  pendingOrders: number;
  totalCustomers: number;
  revenueChange: string;
  ordersChange: string;
}

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

interface ActiveChat {
  id: string;
  customerName: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

export default function DashboardPage() {
  const { socket, setPendingOrdersCount } = useAdminStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [statsRes, revenueRes, ordersRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRevenueChart(7),
        dashboardAPI.getRecentOrders(8),
      ]);
      setStats(statsRes.data);
      setRevenueData(revenueRes.data || []);
      setRecentOrders(ordersRes.data?.orders || []);
      setActiveChats(ordersRes.data?.activeChats || []);
      if (statsRes.data.pendingOrders) {
        setPendingOrdersCount(statsRes.data.pendingOrders);
      }
    } catch {
      // Use placeholder data when API isn't connected
      setStats({
        revenueToday: 4850.0,
        ordersToday: 24,
        activeChats: 7,
        pendingOrders: 5,
        totalCustomers: 1284,
        revenueChange: '+12%',
        ordersChange: '+3',
      });
      setRevenueData([
        { date: 'Mon', revenue: 3200 },
        { date: 'Tue', revenue: 4100 },
        { date: 'Wed', revenue: 3800 },
        { date: 'Thu', revenue: 5200 },
        { date: 'Fri', revenue: 4850 },
        { date: 'Sat', revenue: 6100 },
        { date: 'Sun', revenue: 4850 },
      ]);
      setRecentOrders([
        { id: '1', orderNumber: 'ORD-001', customerName: 'Kwame Asante', total: 240.0, status: 'processing', createdAt: new Date().toISOString(), itemCount: 3 },
        { id: '2', orderNumber: 'ORD-002', customerName: 'Ama Mensah', total: 89.5, status: 'placed', createdAt: new Date().toISOString(), itemCount: 1 },
        { id: '3', orderNumber: 'ORD-003', customerName: 'Kofi Boateng', total: 560.0, status: 'shipped', createdAt: new Date().toISOString(), itemCount: 5 },
        { id: '4', orderNumber: 'ORD-004', customerName: 'Abena Ofori', total: 120.0, status: 'delivered', createdAt: new Date().toISOString(), itemCount: 2 },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleNewOrder = () => fetchData(true);
    socket.on('order:new', handleNewOrder);
    return () => { socket.off('order:new', handleNewOrder); };
  }, [socket]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Welcome back! Here's what's happening today.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          loading={refreshing}
        >
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            title="Revenue Today"
            value={formatCurrency(stats.revenueToday)}
            change={stats.revenueChange}
            icon={<DollarSign size={22} />}
            color="green"
          />
          <StatCard
            title="Orders Today"
            value={stats.ordersToday}
            change={stats.ordersChange}
            icon={<ShoppingCart size={22} />}
            color="brand"
          />
          <StatCard
            title="Active Chats"
            value={stats.activeChats}
            icon={<MessageSquare size={22} />}
            color="blue"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={<Clock size={22} />}
            color="amber"
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString()}
            icon={<Users size={22} />}
            color="rose"
          />
        </div>
      )}

      {/* Chart + Active Chats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Revenue — Last 7 Days</h2>
              <p className="text-sm text-slate-500 mt-0.5">Daily revenue performance</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '13px',
                }}
                formatter={(v: number) => [formatCurrency(v), 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Active Chats */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Active Chats</h2>
          {activeChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <MessageSquare size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No active chats</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeChats.slice(0, 6).map((chat) => (
                <div key={chat.id} className="flex items-start gap-3">
                  <Avatar name={chat.customerName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900 truncate">{chat.customerName}</p>
                      <span className="text-xs text-slate-400 shrink-0">{formatRelativeTime(chat.updatedAt)}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="shrink-0 h-5 w-5 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
          <a href="/orders" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
            View all
          </a>
        </div>
        <Table>
          <TableHead>
            <tr>
              <Th>Order #</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Total</Th>
              <Th>Status</Th>
              <Th>Time</Th>
            </tr>
          </TableHead>
          <TableBody>
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                  No orders yet
                </td>
              </tr>
            ) : (
              recentOrders.map((order) => (
                <Tr key={order.id}>
                  <Td className="font-medium text-brand-500">{order.orderNumber}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={order.customerName} size="sm" />
                      <span>{order.customerName}</span>
                    </div>
                  </Td>
                  <Td>{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</Td>
                  <Td className="font-medium">{formatCurrency(order.total)}</Td>
                  <Td><StatusBadge status={order.status} /></Td>
                  <Td className="text-slate-400">{formatRelativeTime(order.createdAt)}</Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
