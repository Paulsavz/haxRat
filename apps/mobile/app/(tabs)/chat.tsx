import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import {
  Chat,
  ChannelList,
  Channel,
  MessageList,
  MessageInput,
} from 'stream-chat-expo'
import type { Channel as StreamChannel } from 'stream-chat'
import { useAdminStore } from '../../store/adminStore'
import { getStreamVideoClient } from '../../lib/stream'
import { Camera } from 'expo-camera'

export default function ChatScreen() {
  const params = useLocalSearchParams<{ channelId?: string }>()
  const { streamChatClient, admin, setUnreadCount } = useAdminStore()

  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null)
  const [showChannel, setShowChannel] = useState(false)

  // Auto-open a channel passed via route params (from orders tab)
  useEffect(() => {
    if (params.channelId && streamChatClient && !showChannel) {
      const ch = streamChatClient.channel('messaging', params.channelId)
      setActiveChannel(ch)
      setShowChannel(true)
    }
  }, [params.channelId, streamChatClient])

  // Track unread count
  useEffect(() => {
    if (!streamChatClient) return

    const handler = () => {
      const count = streamChatClient.user?.total_unread_count ?? 0
      setUnreadCount(count)
    }

    streamChatClient.on('notification.message_new', handler)
    streamChatClient.on('message.new', handler)

    return () => {
      streamChatClient.off('notification.message_new', handler)
      streamChatClient.off('message.new', handler)
    }
  }, [streamChatClient])

  async function startCall(type: 'audio' | 'video') {
    if (!activeChannel || !admin) return

    const { status: camStatus } = await Camera.requestCameraPermissionsAsync()
    const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync()

    if (type === 'video' && camStatus !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed for video calls.')
      return
    }
    if (micStatus !== 'granted') {
      Alert.alert('Permission Required', 'Microphone access is needed for calls.')
      return
    }

    const videoClient = getStreamVideoClient()
    if (!videoClient) {
      Alert.alert('Error', 'Video client not initialised. Please log out and back in.')
      return
    }

    const callId = `chat-${activeChannel.id}-${Date.now()}`
    const callType = type === 'video' ? 'default' : 'audio_room'
    const call = videoClient.call(callType, callId)

    await call.getOrCreate({
      data: {
        members: [{ user_id: admin.id, role: 'admin' }],
        custom: { channelId: activeChannel.id },
      },
    })
    await call.join({ create: false })

    setShowChannel(false)
    router.push('/(tabs)/calls')
  }

  if (!streamChatClient) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" size="large" />
        <Text style={styles.centreText}>Connecting to chat…</Text>
      </View>
    )
  }

  // ─── Channel view ──────────────────────────────────────────────────────────
  if (showChannel && activeChannel) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.channelHeader}>
          <TouchableOpacity onPress={() => setShowChannel(false)} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.channelTitle} numberOfLines={1}>
            {(activeChannel.data as any)?.name ??
              (activeChannel.data as any)?.customer_name ??
              'Support Chat'}
          </Text>
          <View style={styles.callButtons}>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => startCall('audio')}
            >
              <Text style={styles.callBtnText}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.callBtn, { marginLeft: 8 }]}
              onPress={() => startCall('video')}
            >
              <Text style={styles.callBtnText}>📹</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Chat client={streamChatClient} style={chatTheme}>
          <Channel channel={activeChannel}>
            <MessageList />
            <MessageInput />
          </Channel>
        </Chat>
      </SafeAreaView>
    )
  }

  // ─── Channel list ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat Inbox</Text>
      </View>

      <Chat client={streamChatClient} style={chatTheme}>
        <ChannelList
          filters={{ members: { $in: [admin!.id] }, type: 'messaging' }}
          sort={{ last_message_at: -1 }}
          options={{ limit: 30, state: true, watch: true }}
          onSelect={(channel) => {
            setActiveChannel(channel)
            setShowChannel(true)
          }}
        />
      </Chat>
    </SafeAreaView>
  )
}

// Minimal dark theme tokens for Stream Chat Expo
const chatTheme = {
  channelListMessenger: {
    flatList: { backgroundColor: '#0f172a' },
  },
  channelPreview: {
    container: { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' },
    title: { color: '#f1f5f9' },
    message: { color: '#64748b' },
  },
  messageList: {
    container: { backgroundColor: '#0f172a' },
  },
  messageInput: {
    container: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
  },
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  centreText: { color: '#64748b', marginTop: 12, fontSize: 14 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: { paddingRight: 10 },
  backText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  channelTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  callButtons: { flexDirection: 'row' },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtnText: { fontSize: 16 },
})
