import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { format } from 'date-fns'
import { Order, OrderStatus } from '../lib/api'

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  placed: { bg: '#1d4ed8', text: '#bfdbfe' },
  confirmed: { bg: '#0369a1', text: '#bae6fd' },
  processing: { bg: '#a16207', text: '#fef08a' },
  shipped: { bg: '#6d28d9', text: '#ddd6fe' },
  delivered: { bg: '#15803d', text: '#bbf7d0' },
  cancelled: { bg: '#b91c1c', text: '#fecaca' },
}

interface OrderCardProps {
  order: Order
  onPress?: (order: Order) => void
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const statusStyle = STATUS_COLORS[order.status] ?? { bg: '#334155', text: '#cbd5e1' }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(order)}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.badgeText, { color: statusStyle.text }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.customerName}>{order.customerName}</Text>
      <Text style={styles.customerEmail} numberOfLines={1}>
        {order.customerEmail}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.total}>${order.total.toFixed(2)}</Text>
        <Text style={styles.time}>
          {format(new Date(order.createdAt), 'MMM d, h:mm a')}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  time: {
    fontSize: 12,
    color: '#64748b',
  },
})
