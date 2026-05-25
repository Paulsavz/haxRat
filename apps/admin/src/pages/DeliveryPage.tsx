import { useEffect, useState } from 'react';
import { Truck, MapPin, Clock, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface Delivery {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered';
  driverName?: string;
  estimatedTime?: string;
  total: number;
  updatedAt: string;
}

const MOCK_DELIVERIES: Delivery[] = [
  { id: '1', orderNumber: 'ORD-001', customerName: 'Kwame Asante', address: '12 Independence Ave, Accra', status: 'in_transit', driverName: 'Emmanuel Asare', estimatedTime: '2:30 PM', total: 240, updatedAt: new Date(Date.now() - 1800000).toISOString() },
  { id: '2', orderNumber: 'ORD-003', customerName: 'Kofi Boateng', address: '7 Liberation Road, Accra', status: 'picked_up', driverName: 'Joseph Mensah', total: 340, updatedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', orderNumber: 'ORD-006', customerName: 'Esi Ampah', address: '45 Ring Road, Kumasi', status: 'pending', total: 180, updatedAt: new Date(Date.now() - 300000).toISOString() },
  { id: '4', orderNumber: 'ORD-007', customerName: 'Nana Osei', address: '22 Cantonments, Accra', status: 'assigned', driverName: 'Emmanuel Asare', total: 95, updatedAt: new Date(Date.now() - 900000).toISOString() },
  { id: '5', orderNumber: 'ORD-004', customerName: 'Abena Ofori', address: '22 Cantonments, Accra', status: 'delivered', driverName: 'Joseph Mensah', total: 120, updatedAt: new Date(Date.now() - 86400000).toISOString() },
];

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

const STATUS_VARIANT: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger' | 'purple'> = {
  pending: 'warning',
  assigned: 'info',
  picked_up: 'purple',
  in_transit: 'default',
  delivered: 'success',
};

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = async () => {
    try {
      const res = await api.get('/admin/deliveries');
      setDeliveries(res.data?.deliveries || res.data || []);
    } catch {
      setDeliveries(MOCK_DELIVERIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeliveries(); }, []);

  const stats = {
    pending: deliveries.filter((d) => d.status === 'pending').length,
    inTransit: deliveries.filter((d) => d.status === 'in_transit').length,
    delivered: deliveries.filter((d) => d.status === 'delivered').length,
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Delivery</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track and manage deliveries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Pickup', value: stats.pending, icon: <Package size={20} />, color: 'bg-amber-50 text-amber-500' },
          { label: 'In Transit', value: stats.inTransit, icon: <Truck size={20} />, color: 'bg-blue-50 text-blue-500' },
          { label: 'Delivered Today', value: stats.delivered, icon: <MapPin size={20} />, color: 'bg-green-50 text-green-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Deliveries Table */}
      <Table>
        <TableHead>
          <tr>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Address</Th>
            <Th>Driver</Th>
            <Th>Status</Th>
            <Th>ETA</Th>
            <Th>Total</Th>
            <Th>Updated</Th>
          </tr>
        </TableHead>
        <TableBody>
          {deliveries.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">No deliveries</td>
            </tr>
          ) : (
            deliveries.map((delivery) => (
              <Tr key={delivery.id}>
                <Td className="font-medium text-brand-500">{delivery.orderNumber}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Avatar name={delivery.customerName} size="sm" />
                    <span className="font-medium text-slate-900">{delivery.customerName}</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-start gap-1.5 text-slate-600 max-w-48">
                    <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-xs">{delivery.address}</span>
                  </div>
                </Td>
                <Td>{delivery.driverName || <span className="text-slate-400">Unassigned</span>}</Td>
                <Td>
                  <StatusBadge status={delivery.status} />
                </Td>
                <Td>
                  {delivery.estimatedTime ? (
                    <div className="flex items-center gap-1 text-slate-600">
                      <Clock size={13} />
                      <span className="text-sm">{delivery.estimatedTime}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </Td>
                <Td className="font-semibold">{formatCurrency(delivery.total)}</Td>
                <Td className="text-slate-400">{formatRelativeTime(delivery.updatedAt)}</Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
