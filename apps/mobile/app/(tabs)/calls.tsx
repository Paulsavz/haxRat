import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  StreamVideo,
  StreamCall,
  CallContent,
  useCalls,
  useStreamVideoClient,
  CallingState,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk'
import { useAdminStore } from '../../store/adminStore'
import { Camera } from 'expo-camera'

// ─── Incoming call card ────────────────────────────────────────────────────────

function IncomingCallCard({ call }: { call: any }) {
  const callerName =
    call.state.createdBy?.name ?? call.state.createdBy?.id ?? 'Unknown'
  const callType = call.type === 'audio_room' ? 'Audio Call' : 'Video Call'

  async function handleAccept() {
    const { status: camStatus } = await Camera.requestCameraPermissionsAsync()
    const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync()

    if (micStatus !== 'granted') {
      Alert.alert('Permission Required', 'Microphone access is needed to accept calls.')
      return
    }
    if (call.type !== 'audio_room' && camStatus !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed for video calls.')
      return
    }

    await call.accept()
    await call.join()
  }

  async function handleDecline() {
    await call.leave({ reject: true })
  }

  return (
    <View style={styles.incomingCard}>
      <View style={styles.incomingInfo}>
        <View style={styles.callerAvatar}>
          <Text style={styles.callerInitial}>{callerName[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callType}>Incoming {callType}</Text>
        </View>
      </View>
      <View style={styles.callActions}>
        <TouchableOpacity
          style={[styles.callActionBtn, styles.declineBtn]}
          onPress={handleDecline}
        >
          <Text style={styles.callActionText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.callActionBtn, styles.acceptBtn]}
          onPress={handleAccept}
        >
          <Text style={styles.callActionText}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Active call view ──────────────────────────────────────────────────────────

function ActiveCallView({ call }: { call: any }) {
  const { useCallCallingState } = useCallStateHooks()
  const callingState = useCallCallingState()

  if (
    callingState === CallingState.IDLE ||
    callingState === CallingState.LEFT
  ) {
    return null
  }

  return (
    <View style={styles.activeCallWrap}>
      <StreamCall call={call}>
        <CallContent />
      </StreamCall>
    </View>
  )
}

// ─── Main calls screen ─────────────────────────────────────────────────────────

function CallsInner() {
  const calls = useCalls()
  const videoClient = useStreamVideoClient()

  const incomingCalls = calls.filter(
    (c) => c.state.callingState === CallingState.RINGING
  )
  const activeCall = calls.find(
    (c) =>
      c.state.callingState === CallingState.JOINED ||
      c.state.callingState === CallingState.JOINING
  )

  // Placeholder call history (in production, fetch from your API)
  const [callHistory] = useState<
    { id: string; name: string; type: string; duration: string; time: string }[]
  >([
    { id: '1', name: 'Alice Johnson', type: 'Video', duration: '4m 32s', time: '2h ago' },
    { id: '2', name: 'Bob Smith', type: 'Audio', duration: '1m 10s', time: '5h ago' },
    { id: '3', name: 'Carol Williams', type: 'Video', duration: '12m 04s', time: 'Yesterday' },
  ])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Calls</Text>
      </View>

      {/* Active call */}
      {activeCall && <ActiveCallView call={activeCall} />}

      {/* Incoming calls */}
      {incomingCalls.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incoming Calls</Text>
          {incomingCalls.map((c) => (
            <IncomingCallCard key={c.id} call={c} />
          ))}
        </View>
      )}

      {/* No active calls notice */}
      {!activeCall && incomingCalls.length === 0 && (
        <View style={styles.noCallsWrap}>
          <Text style={styles.noCallsEmoji}>📞</Text>
          <Text style={styles.noCallsText}>No active calls</Text>
          <Text style={styles.noCallsSub}>
            Incoming calls will appear here automatically
          </Text>
        </View>
      )}

      {/* Call history */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Calls</Text>
        <FlatList
          data={callHistory}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View style={styles.historyAvatar}>
                <Text style={styles.historyInitial}>{item.name[0]}</Text>
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyName}>{item.name}</Text>
                <Text style={styles.historyMeta}>
                  {item.type === 'Video' ? '📹' : '📞'} {item.type} · {item.duration}
                </Text>
              </View>
              <Text style={styles.historyTime}>{item.time}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  )
}

// ─── Screen export (wraps with StreamVideo if needed) ─────────────────────────

export default function CallsScreen() {
  const { streamVideoClient } = useAdminStore()

  if (!streamVideoClient) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" size="large" />
        <Text style={styles.centreText}>Connecting to call service…</Text>
      </View>
    )
  }

  // StreamVideo provider is already mounted in _layout, so we can use hooks directly.
  return <CallsInner />
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  centreText: { color: '#64748b', marginTop: 12, fontSize: 14 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 16,
  },

  // Active call
  activeCallWrap: {
    height: 340,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },

  // Incoming call card
  incomingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  incomingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  callerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  callerInitial: { fontSize: 18, fontWeight: '700', color: '#fff' },
  callerName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  callType: { fontSize: 12, color: '#64748b', marginTop: 2 },
  callActions: { flexDirection: 'row', gap: 10 },
  callActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: { backgroundColor: '#15803d' },
  declineBtn: { backgroundColor: '#b91c1c' },
  callActionText: { fontSize: 20, color: '#fff' },

  // No calls
  noCallsWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  noCallsEmoji: { fontSize: 48, marginBottom: 12 },
  noCallsText: { fontSize: 17, fontWeight: '700', color: '#64748b', marginBottom: 6 },
  noCallsSub: { fontSize: 13, color: '#334155', textAlign: 'center', lineHeight: 20 },

  // History
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInitial: { fontSize: 16, fontWeight: '700', color: '#94a3b8' },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14, fontWeight: '600', color: '#f1f5f9', marginBottom: 2 },
  historyMeta: { fontSize: 12, color: '#64748b' },
  historyTime: { fontSize: 11, color: '#475569' },
})
