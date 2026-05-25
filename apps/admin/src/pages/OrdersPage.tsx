import { useEffect, useState, useCallback } from 'react';
import { Search, Printer, Eye, ChevronDown } from 'lucide-react';
import { ordersAPI } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import Avatar from '@/components/ui/Avatar';
import { LoadingScreen } from '@/components/ui/Spinner';
import { formatCurrency, formatDate, formatRelativeTime, ORDER_STATUSES } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
  imageUrl?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  address?: string;
  notes?: string;
}

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'placed', label: 'Placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const { socket } = useAdminStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (search) params.search = search;
      const res = await ordersAPI.list(params);
      setOrders(res.data?.orders || res.data || []);
    } catch {
      // Placeholder data
      setOrders([
        { id: '1', orderNumber: 'ORD-001', customerName: 'Kwame Asante', customerPhone: '+233244123456', items: [{ name: 'Wireless Earbuds', qty: 1, price: 150 }, { name: 'Phone Case', qty: 2, price: 45 }], total: 240, status: 'processing', createdAt: new Date(Date.now() - 3600000).toISOString(), address: '12 Independence Ave, Accra' },
        { id: '2', orderNumber: 'ORD-002', customerName: 'Ama Mensah', customerPhone: '+233205678901', items: [{ name: 'Smart Watch', qty: 1, price: 89.5 }], total: 89.5, status: 'placed', createdAt: new Date(Date.now() - 7200000).toISOString(), address: '45 Ring Road, Kumasi' },
        { id: '3', orderNumber: 'ORD-003', customerName: 'Kofi Boateng', customerPhone: '+233209876543', items: [{ name: 'Laptop Bag', qty: 1, price: 120 }, { name: 'USB Hub', qty: 2, price: 80 }, { name: 'Mouse', qty: 1, price: 60 }], total: 340, status: 'shipped', createdAt: new Date(Date.now() - 86400000).toISOString(), address: '7 Liberation Road, Accra' },
        { id: '4', orderNumber: 'ORD-004', customerName: 'Abena Ofori', customerPhone: '+233557890123', items: [{ name: 'Bluetooth Speaker', qty: 1, price: 120 }], total: 120, status: 'delivered', createdAt: new Date(Date.now() - 172800000).toISOString(), address: '22 Cantonments, Accra' },
        { id: '5', orderNumber: 'ORD-005', customerName: 'Yaw Darko', customerPhone: '+233244456789', items: [{ name: 'Gaming Controller', qty: 1, price: 200 }], total: 200, status: 'cancelled', createdAt: new Date(Date.now() - 259200000).toISOString(), address: '5 East Legon, Accra' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time new orders
  useEffect(() => {
    if (!socket) return;
    socket.on('order:new', fetchOrders);
    socket.on('order:status_updated', fetchOrders);
    return () => {
      socket.off('order:new', fetchOrders);
      socket.off('order:status_updated', fetchOrders);
    };
  }, [socket, fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
      }
      toast.success('Order status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handlePrintInvoice = async (orderId: string) => {
    try {
      const res = await ordersAPI.getInvoice(orderId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      toast.error('Invoice not available');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <span className="text-sm text-slate-500">{orders.length} orders</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="overflow-x-auto">
          <Tabs
            tabs={STATUS_TABS}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>
        <div className="flex-1 max-w-xs ml-auto">
          <Input
            placeholder="Search order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHead>
          <tr>
            <Th>Order #</Th>
            <Th>Customer</Th>
            <Th>Items</Th>
            <Th>Total</Th>
            <Th>Status</Th>
            <Th>Date</Th>
            <Th>Actions</Th>
          </tr>
        </TableHead>
        <TableBody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                No orders found
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <Tr key={order.id} onClick={() => setSelectedOrder(order)}>
                <Td className="font-medium text-brand-500">{order.orderNumber}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Avatar name={order.customerName} size="sm" />
                    <div>
                      <p className="font-medium text-slate-900">{order.customerName}</p>
                      {order.customerPhone && (
                        <p className="text-xs text-slate-400">{order.customerPhone}</p>
                      )}
                    </div>
                  </div>
                </Td>
                <Td>{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</Td>
                <Td className="font-semibold">{formatCurrency(order.total)}</Td>
                <Td><StatusBadge status={order.status} /></Td>
                <Td className="text-slate-400">{formatDate(order.createdAt)}</Td>
                <Td onClick={(e) => e?.stopPropagation?.()}>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" onClick={() => setSelectedOrder(order)}>
                      <Eye size={15} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handlePrintInvoice(order.id)}
                    >
                      <Printer size={15} />
                    </Button>
                    <div className="relative">
                      <select
                        className="h-8 pl-2 pr-6 text-xs border border-slate-200 rounded-md bg-white text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500"
                        value={order.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(order.id, e.target.value);
                        }}
                        disabled={updatingStatus === order.id}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s} className="capitalize">
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>

      {/* Order Detail Modal */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.orderNumber}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Customer Info */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Avatar name={selectedOrder.customerName} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">{selectedOrder.customerName}</p>
                <p className="text-sm text-slate-500">{selectedOrder.customerPhone}</p>
                {selectedOrder.address && (
                  <p className="text-xs text-slate-400 mt-1">{selectedOrder.address}</p>
                )}
              </div>
              <div className="ml-auto">
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Order Items</h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400">Qty: {item.qty}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 mt-2">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-lg text-brand-600">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Order Date</p>
                <p className="font-medium">{formatDate(selectedOrder.createdAt, 'MMM dd, yyyy HH:mm')}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Placed</p>
                <p className="font-medium">{formatRelativeTime(selectedOrder.createdAt)}</p>
              </div>
            </div>

            {/* Status Update */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusUpdate(selectedOrder.id, s)}
                    disabled={selectedOrder.status === s || updatingStatus === selectedOrder.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedOrder.status === s
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handlePrintInvoice(selectedOrder.id)}
              >
                <Printer size={15} />
                Print Invoice
              </Button>
              <Button
                className="flex-1"
                onClick={() => setSelectedOrder(null)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
