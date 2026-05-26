import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { fetchDashboardStats, fetchRecentOrders, Order, DashboardStats } from '../../lib/api'
import { useAdminStore } from '../../store/adminStore'
import { StatCard } from '../../components/StatCard'
import { OrderCard } from '../../components/OrderCard'

export default function DashboardScreen() {
  const { admin, setPendingOrdersCount } = useAdminStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [s, o] = await Promise.all([fetchDashboardStats(), fetchRecentOrders(20)])
      setStats(s)
      setOrders(o)
      setPendingOrdersCount(s.pendingOrders)
      setError(null)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load dashboard')
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  function handleOrderPress(order: Order) {
    router.push({ pathname: '/(tabs)/orders', params: { selectedId: order.id } })
  }

  const initials = admin?.name
    ? admin.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'A'

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} onPress={handleOrderPress} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Header */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.greeting}>Good day</Text>
                <Text style={styles.appTitle}>RetailHub Admin</Text>
              </View>
              <View style={styles.avatarWrap}>
                {admin?.avatarUrl ? (
                  <Image source={{ uri: admin.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stats row */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={onRefresh}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {stats && (
              <View style={styles.statsRow}>
                <StatCard
                  icon={<Text style={styles.emoji}>📦</Text>}
                  label="Orders Today"
                  value={stats.ordersToday}
                />
                <StatCard
                  icon={<Text style={styles.emoji}>💰</Text>}
                  label="Revenue"
                  value={`$${(stats.revenue / 100).toFixed(0)}k`}
                  trend="vs yesterday"
                  trendUp={true}
                />
              </View>
            )}

            {stats && (
              <View style={[styles.statsRow, { marginTop: 8 }]}>
                <StatCard
                  icon={<Text style={styles.emoji}>💬</Text>}
                  label="Active Chats"
                  value={stats.activeChats}
                />
                <StatCard
                  icon={<Text style={styles.emoji}>⏳</Text>}
                  label="Pending"
                  value={stats.pendingOrders}
                />
              </View>
            )}

            <Text style={styles.sectionTitle}>Recent Orders</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No recent orders</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 32 },
  listHeader: { paddingHorizontal: 16 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  appTitle: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  avatarWrap: { alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  statsRow: { flexDirection: 'row', marginBottom: 0 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 24,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  errorBox: {
    backgroundColor: '#450a0a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: { color: '#fca5a5', fontSize: 13 },
  retryText: { color: '#6366f1', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 32 },
  emptyText: { color: '#475569', fontSize: 15 },
  emoji: { fontSize: 18 },
})
