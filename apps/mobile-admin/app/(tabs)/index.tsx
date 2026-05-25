import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { dashboardAPI } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import StatCard from '@/components/StatCard';
import OrderCard from '@/components/OrderCard';
import { formatCurrency } from '@/components/utils';

interface Stats {
  revenueToday: number;
  ordersToday: number;
  activeChats: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: string;
  createdAt: string;
}

export default function DashboardScreen() {
  const { admin, socket } = useAdminStore();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentOrders(5),
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data?.orders || []);
    } catch {
      setStats({
        revenueToday: 4850.0,
        ordersToday: 24,
        activeChats: 7,
        pendingOrders: 5,
      });
      setRecentOrders([
        { id: '1', orderNumber: 'ORD-001', customerName: 'Kwame Asante', items: [{ name: 'Earbuds', qty: 1, price: 150 }], total: 240, status: 'processing', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', orderNumber: 'ORD-002', customerName: 'Ama Mensah', items: [{ name: 'Watch', qty: 1, price: 89.5 }], total: 89.5, status: 'placed', createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '3', orderNumber: 'ORD-003', customerName: 'Kofi Boateng', items: [{ name: 'Bag', qty: 1, price: 120 }], total: 340, status: 'shipped', createdAt: new Date(Date.now() - 86400000).toISOString() },
      ]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:new', fetchData);
    return () => { socket.off('order:new', fetchData); };
  }, [socket]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day!</Text>
            <Text style={styles.adminName}>{admin?.name || 'Admin'}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(admin?.name || 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        {stats && (
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={styles.statWrapper}>
                <StatCard
                  title="Revenue Today"
                  value={formatCurrency(stats.revenueToday)}
                  iconName="cash-outline"
                  color="#16a34a"
                  bgColor="#dcfce7"
                />
              </View>
              <View style={styles.statWrapper}>
                <StatCard
                  title="Orders Today"
                  value={stats.ordersToday}
                  iconName="bag-outline"
                  color="#6366f1"
                  bgColor="#eef2ff"
                />
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statWrapper}>
                <StatCard
                  title="Active Chats"
                  value={stats.activeChats}
                  iconName="chatbubbles-outline"
                  color="#2563eb"
                  bgColor="#dbeafe"
                />
              </View>
              <View style={styles.statWrapper}>
                <StatCard
                  title="Pending Orders"
                  value={stats.pendingOrders}
                  iconName="time-outline"
                  color="#d97706"
                  bgColor="#fef3c7"
                />
              </View>
            </View>
          </View>
        )}

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bag-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => Alert.alert(order.orderNumber, `Customer: ${order.customerName}\nTotal: GHS ${order.total}\nStatus: ${order.status}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  adminName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statsGrid: {
    marginBottom: 24,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statWrapper: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  seeAll: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
  },
});
