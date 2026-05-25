import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ordersAPI } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import OrderCard from '@/components/OrderCard';
import { formatCurrency, ORDER_STATUSES, STATUS_COLORS } from '@/components/utils';
interface OrderItem {
  name: string;
  qty: number;
  price: number;
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
}

const STATUS_TABS = ['all', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersScreen() {
  const { socket } = useAdminStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeStatus, setActiveStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (activeStatus !== 'all') params.status = activeStatus;
      const res = await ordersAPI.list(params);
      setOrders(res.data?.orders || res.data || []);
    } catch {
      setOrders([
        { id: '1', orderNumber: 'ORD-001', customerName: 'Kwame Asante', customerPhone: '+233244123456', items: [{ name: 'Earbuds', qty: 1, price: 150 }, { name: 'Case', qty: 2, price: 45 }], total: 240, status: 'processing', createdAt: new Date(Date.now() - 3600000).toISOString(), address: '12 Independence Ave, Accra' },
        { id: '2', orderNumber: 'ORD-002', customerName: 'Ama Mensah', items: [{ name: 'Watch', qty: 1, price: 89.5 }], total: 89.5, status: 'placed', createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '3', orderNumber: 'ORD-003', customerName: 'Kofi Boateng', items: [{ name: 'Bag', qty: 1, price: 120 }], total: 340, status: 'shipped', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '4', orderNumber: 'ORD-004', customerName: 'Abena Ofori', items: [{ name: 'Speaker', qty: 1, price: 120 }], total: 120, status: 'delivered', createdAt: new Date(Date.now() - 172800000).toISOString() },
      ]);
    }
  }, [activeStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:new', fetchOrders);
    return () => { socket.off('order:new', fetchOrders); };
  }, [socket, fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
      }
      Alert.alert('Success', 'Order status updated');
    } catch {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = activeStatus === 'all'
    ? orders
    : orders.filter((o) => o.status === activeStatus);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.count}>{filteredOrders.length} orders</Text>
      </View>

      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {STATUS_TABS.map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setActiveStatus(status)}
            style={[
              styles.chip,
              activeStatus === status && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                activeStatus === status && styles.chipTextActive,
              ]}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => setSelectedOrder(item)} />
        )}
      />

      {/* Order Detail Modal */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedOrder.orderNumber}</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Customer Info */}
              <View style={styles.customerCard}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {selectedOrder.customerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{selectedOrder.customerName}</Text>
                  {selectedOrder.customerPhone && (
                    <Text style={styles.customerPhone}>{selectedOrder.customerPhone}</Text>
                  )}
                  {selectedOrder.address && (
                    <Text style={styles.address}>{selectedOrder.address}</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedOrder.status]?.bg || '#f1f5f9' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[selectedOrder.status]?.text || '#475569' }]}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Text>
                </View>
              </View>

              {/* Items */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>Items</Text>
                {selectedOrder.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name} × {item.qty}</Text>
                    <Text style={styles.itemPrice}>{formatCurrency(item.price * item.qty)}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatCurrency(selectedOrder.total)}</Text>
                </View>
              </View>

              {/* Update Status */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>Update Status</Text>
                <View style={styles.statusGrid}>
                  {ORDER_STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => handleStatusUpdate(selectedOrder.id, status)}
                      disabled={selectedOrder.status === status || updatingStatus}
                      style={[
                        styles.statusButton,
                        selectedOrder.status === status && styles.statusButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          selectedOrder.status === status && styles.statusButtonTextActive,
                        ]}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  count: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  chips: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#6366f1' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 30 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#94a3b8', fontSize: 14, marginTop: 12 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  closeBtn: { padding: 4 },
  modalContent: { padding: 16, gap: 16 },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  customerName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  customerPhone: { fontSize: 13, color: '#64748b', marginTop: 2 },
  address: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 14, color: '#0f172a' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#475569' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#6366f1' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  statusButtonActive: { backgroundColor: '#6366f1' },
  statusButtonText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  statusButtonTextActive: { color: '#fff' },
});
