import { useEffect, useState, useCallback } from 'react';
import { Search, MessageSquare, Phone, ShoppingBag } from 'lucide-react';
import { customersAPI, callsAPI } from '@/lib/api';
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/ui/Spinner';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  ordersCount: number;
  totalSpent: number;
  registeredAt: string;
  lastActive?: string;
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customersAPI.list(search ? { search } : {});
      setCustomers(res.data?.customers || res.data || []);
    } catch {
      setCustomers([
        { id: '1', name: 'Kwame Asante', email: 'kwame@example.com', phone: '+233244123456', ordersCount: 8, totalSpent: 1240.50, registeredAt: new Date(Date.now() - 180 * 86400000).toISOString(), lastActive: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', name: 'Ama Mensah', email: 'ama@example.com', phone: '+233205678901', ordersCount: 3, totalSpent: 340.00, registeredAt: new Date(Date.now() - 90 * 86400000).toISOString(), lastActive: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', name: 'Kofi Boateng', email: 'kofi@example.com', phone: '+233209876543', ordersCount: 15, totalSpent: 5670.00, registeredAt: new Date(Date.now() - 365 * 86400000).toISOString(), lastActive: new Date(Date.now() - 7200000).toISOString() },
        { id: '4', name: 'Abena Ofori', email: 'abena@example.com', phone: '+233557890123', ordersCount: 1, totalSpent: 120.00, registeredAt: new Date(Date.now() - 14 * 86400000).toISOString(), lastActive: new Date(Date.now() - 604800000).toISOString() },
        { id: '5', name: 'Yaw Darko', email: 'yaw@example.com', phone: '+233244456789', ordersCount: 6, totalSpent: 890.00, registeredAt: new Date(Date.now() - 60 * 86400000).toISOString(), lastActive: new Date(Date.now() - 172800000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setOrdersLoading(true);
    try {
      const res = await customersAPI.getOrderHistory(customer.id);
      setCustomerOrders(res.data?.orders || res.data || []);
    } catch {
      setCustomerOrders([
        { id: '1', orderNumber: 'ORD-001', total: 240, status: 'delivered', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '2', orderNumber: 'ORD-005', total: 150, status: 'processing', createdAt: new Date(Date.now() - 3600000).toISOString() },
      ]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleStartChat = (customer: Customer) => {
    setSelectedCustomer(null);
    navigate('/chat');
    toast.success(`Opening chat with ${customer.name}`);
  };

  const handleCall = async (customer: Customer, type: 'audio' | 'video') => {
    try {
      const res = await callsAPI.initiateCall(customer.id, type);
      if (res.data?.roomUrl) window.open(res.data.roomUrl, '_blank', 'width=800,height=600');
      toast.success(`${type === 'video' ? 'Video' : 'Voice'} call initiated`);
    } catch {
      toast.error('Failed to initiate call');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <span className="text-sm text-slate-500">{customers.length} customers</span>
      </div>

      <div className="max-w-xs">
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={15} />}
        />
      </div>

      <Table>
        <TableHead>
          <tr>
            <Th>Customer</Th>
            <Th>Phone</Th>
            <Th>Orders</Th>
            <Th>Total Spent</Th>
            <Th>Registered</Th>
            <Th>Last Active</Th>
          </tr>
        </TableHead>
        <TableBody>
          {customers.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                No customers found
              </td>
            </tr>
          ) : (
            customers.map((customer) => (
              <Tr key={customer.id} onClick={() => handleSelectCustomer(customer)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={customer.name} size="sm" />
                    <div>
                      <p className="font-medium text-slate-900">{customer.name}</p>
                      {customer.email && <p className="text-xs text-slate-400">{customer.email}</p>}
                    </div>
                  </div>
                </Td>
                <Td className="text-slate-600">{customer.phone || '—'}</Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag size={13} className="text-slate-400" />
                    <span>{customer.ordersCount}</span>
                  </div>
                </Td>
                <Td className="font-semibold">{formatCurrency(customer.totalSpent)}</Td>
                <Td className="text-slate-400">{formatDate(customer.registeredAt)}</Td>
                <Td className="text-slate-400">{customer.lastActive ? formatRelativeTime(customer.lastActive) : '—'}</Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>

      {/* Customer Detail Modal */}
      <Modal
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Profile"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-5">
            {/* Profile */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <Avatar name={selectedCustomer.name} size="xl" />
              <div className="flex-1">
                <p className="text-xl font-bold text-slate-900">{selectedCustomer.name}</p>
                {selectedCustomer.email && <p className="text-sm text-slate-500">{selectedCustomer.email}</p>}
                {selectedCustomer.phone && <p className="text-sm text-slate-500">{selectedCustomer.phone}</p>}
                <p className="text-xs text-slate-400 mt-1">Joined {formatDate(selectedCustomer.registeredAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Spent</p>
                <p className="text-xl font-bold text-brand-600">{formatCurrency(selectedCustomer.totalSpent)}</p>
                <p className="text-xs text-slate-400">{selectedCustomer.ordersCount} orders</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleStartChat(selectedCustomer)}
              >
                <MessageSquare size={15} />
                Chat
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleCall(selectedCustomer, 'audio')}
              >
                <Phone size={15} />
                Voice Call
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleCall(selectedCustomer, 'video')}
              >
                <Phone size={15} />
                Video Call
              </Button>
            </div>

            {/* Order History */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Order History</h3>
              {ordersLoading ? (
                <div className="text-center py-6 text-slate-400 text-sm">Loading orders...</div>
              ) : customerOrders.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">No orders yet</div>
              ) : (
                <div className="space-y-2">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-brand-600">{order.orderNumber}</p>
                        <p className="text-xs text-slate-400">{formatRelativeTime(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <span className="font-semibold text-sm">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
