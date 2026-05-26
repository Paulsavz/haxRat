import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
}

export function StatCard({ icon, label, value, trend, trendUp }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend ? (
        <Text style={[styles.trend, trendUp ? styles.trendUp : styles.trendDown]}>
          {trendUp ? '▲' : '▼'} {trend}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'flex-start',
    minWidth: 100,
  },
  iconWrap: {
    marginBottom: 8,
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trend: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  trendUp: {
    color: '#22c55e',
  },
  trendDown: {
    color: '#ef4444',
  },
})
