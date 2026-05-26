import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { disconnectChatUser, disconnectVideoClient } from '../../lib/stream'
import { useAdminStore } from '../../store/adminStore'

export default function SettingsScreen() {
  const { admin, logout } = useAdminStore()

  const [orderNotifications, setOrderNotifications] = useState(true)
  const [chatNotifications, setChatNotifications] = useState(true)
  const [callNotifications, setCallNotifications] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  const initials = admin?.name
    ? admin.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'A'

  function confirmLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of RetailHub Admin?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: handleLogout },
      ]
    )
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      // Disconnect Stream services
      await Promise.allSettled([disconnectChatUser(), disconnectVideoClient()])

      // Sign out of Supabase
      await supabase.auth.signOut()

      // Clear stored tokens
      await AsyncStorage.multiRemove(['access_token', 'stream_token'])

      // Reset Zustand store
      logout()

      router.replace('/auth/login')
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Logout failed')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          {admin?.avatarUrl ? (
            <Image source={{ uri: admin.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{admin?.name ?? 'Admin'}</Text>
            <Text style={styles.profileEmail}>{admin?.email ?? ''}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{admin?.role ?? 'admin'}</Text>
            </View>
          </View>
        </View>

        {/* Notifications section */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <ToggleRow
            label="New Orders"
            description="Alert when a new order is placed"
            value={orderNotifications}
            onChange={setOrderNotifications}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Chat Messages"
            description="Alert for new customer messages"
            value={chatNotifications}
            onChange={setChatNotifications}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Incoming Calls"
            description="Alert for customer call requests"
            value={callNotifications}
            onChange={setCallNotifications}
          />
        </View>

        {/* App info section */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <InfoRow label="App Version" value="1.0.0" />
          <View style={styles.divider} />
          <InfoRow label="API Endpoint" value={process.env.EXPO_PUBLIC_API_URL ?? 'N/A'} />
          <View style={styles.divider} />
          <InfoRow label="Platform" value="Android" />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
          onPress={confirmLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>
            {loggingOut ? 'Signing out…' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#334155', true: '#6366f1' }}
        thumbColor={value ? '#fff' : '#94a3b8'}
      />
    </View>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { paddingHorizontal: 16, paddingBottom: 48 },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f1f5f9',
    paddingTop: 16,
    marginBottom: 20,
  },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '700', color: '#f1f5f9', marginBottom: 2 },
  profileEmail: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#312e81',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase' },

  // Section
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: '#334155' },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowText: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: '#f1f5f9' },
  rowDescription: { fontSize: 12, color: '#64748b', marginTop: 2 },
  infoValue: { fontSize: 13, color: '#64748b', maxWidth: '50%', textAlign: 'right' },

  // Logout
  logoutBtn: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutBtnDisabled: { opacity: 0.5 },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#fca5a5' },
})
