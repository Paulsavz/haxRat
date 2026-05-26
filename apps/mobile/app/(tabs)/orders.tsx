import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { fetchOrders, updateOrderStatus, Order, OrderStatus } from '../../lib/api'
import { OrderCard } from '../../components/OrderCard'
import { useAdminStore } from '../../store/adminStore'
import { getStreamVideoClient } from '../../lib/stream'
import { Camera } from 'expo-camera'

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Placed', value: 'placed' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
]

const STATUS_ACTIONS: OrderStatus[] = [
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

export default function OrdersScreen() {
  const params = useLocalSearchParams<{ selectedId?: string }>()
  const { admin } = useAdminStore()

  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await fetchOrders(filter === 'all' ? undefined : filter)
      setOrders(data)
    } catch {
      // silently fail — data stays stale
    }
  }, [filter])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  // Auto-open order passed via route params (from dashboard tap)
  useEffect(() => {
    if (params.selectedId && orders.length > 0) {
      const found = orders.find((o) => o.id === params.selectedId)
      if (found) setSelectedOrder(found)
    }
  }, [params.selectedId, orders])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  async function handleStatusUpdate(orderId: string, status: OrderStatus) {
    setUpdatingStatus(true)
    try {
      const updated = await updateOrderStatus(orderId, status)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      setSelectedOrder(updated)
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleCallCustomer(order: Order) {
    const { status } = await Camera.requestCameraPermissionsAsync()
    const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync()

    if (status !== 'granted' || micStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and microphone permissions are needed for video calls.'
      )
      return
    }

    const videoClient = getStreamVideoClient()
    if (!videoClient) {
      Alert.alert('Error', 'Video client not initialized. Please log out and back in.')
      return
    }

    const callId = `order-${order.id}-${Date.now()}`
    const call = videoClient.call('default', callId)
    await call.getOrCreate({
      data: {
        members: [{ user_id: admin!.id, role: 'admin' }],
        custom: { orderId: order.id, customerName: order.customerName },
      },
    })
    await call.join({ create: false })

    setSelectedOrder(null)
    router.push('/(tabs)/calls')
  }

  function handleMessageCustomer(order: Order) {
    setSelectedOrder(null)
    router.push({ pathname: '/(tabs)/chat', params: { channelId: order.channelId } })
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>

      {/* Status filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersWrap}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, filter === f.value && styles.chipActive]}
            onPress={() => {
              setFilter(f.value)
              setLoading(true)
            }}
          >
            <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => setSelectedOrder(item)} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}

      {/* Order detail modal */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedOrder(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelectedOrder(null)} />
        {selectedOrder && (
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Order header */}
              <Text style={styles.sheetTitle}>
                Order #{selectedOrder.id.slice(-6).toUpperCase()}
              </Text>
              <Text style={styles.sheetCustomer}>{selectedOrder.customerName}</Text>
              <Text style={styles.sheetEmail}>{selectedOrder.customerEmail}</Text>
              {selectedOrder.customerPhone && (
                <Text style={styles.sheetEmail}>{selectedOrder.customerPhone}</Text>
              )}

              {/* Address */}
              <Text style={styles.sectionLabel}>Delivery Address</Text>
              <Text style={styles.sheetAddress}>{selectedOrder.address}</Text>

              {/* Items */}
              <Text style={styles.sectionLabel}>Items</Text>
              {selectedOrder.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {item.name} × {item.quantity}
                  </Text>
                  <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${selectedOrder.total.toFixed(2)}</Text>
              </View>

              {/* Status update */}
              <Text style={styles.sectionLabel}>Update Status</Text>
              <View style={styles.statusButtons}>
                {STATUS_ACTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusBtn,
                      selectedOrder.status === s && styles.statusBtnActive,
                    ]}
                    onPress={() => handleStatusUpdate(selectedOrder.id, s)}
                    disabled={updatingStatus || selectedOrder.status === s}
                  >
                    {updatingStatus && selectedOrder.status !== s ? null : (
                      <Text
                        style={[
                          styles.statusBtnText,
                          selectedOrder.status === s && styles.statusBtnTextActive,
                        ]}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnChat]}
                  onPress={() => handleMessageCustomer(selectedOrder)}
                >
                  <Text style={styles.actionBtnText}>💬 Message</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnCall]}
                  onPress={() => handleCallCustomer(selectedOrder)}
                >
                  <Text style={styles.actionBtnText}>📞 Call</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  filtersWrap: { paddingHorizontal: 12, paddingBottom: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  emptyText: { color: '#475569', fontSize: 15 },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  sheetCustomer: { fontSize: 15, fontWeight: '600', color: '#cbd5e1', marginBottom: 2 },
  sheetEmail: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 6,
  },
  sheetAddress: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemName: { fontSize: 13, color: '#cbd5e1', flex: 1 },
  itemPrice: { fontSize: 13, color: '#f1f5f9', fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginTop: 4,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#6366f1' },
  statusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  statusBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  statusBtnTextActive: { color: '#fff' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnChat: { backgroundColor: '#1d4ed8' },
  actionBtnCall: { backgroundColor: '#15803d' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
})
