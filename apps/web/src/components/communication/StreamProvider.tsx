'use client'

import { useEffect, useRef } from 'react'
import { StreamChat } from 'stream-chat'
import { StreamVideoClient } from '@stream-io/video-react-sdk'
import { useCommunicationStore } from '@/store/communicationStore'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api'

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY || ''

export default function StreamProvider({ children }: { children: React.ReactNode }) {
  const {
    setStreamChatClient,
    setStreamVideoClient,
    setChatToken,
    setVideoToken,
    setUnreadCount,
  } = useCommunicationStore()

  const { user, initialize } = useAuthStore()
  const chatClientRef = useRef<StreamChat | null>(null)
  const videoClientRef = useRef<StreamVideoClient | null>(null)
  const cleanupAuthRef = useRef<(() => void) | null>(null)

  // Initialize Supabase auth listener once
  useEffect(() => {
    const unsub = initialize()
    cleanupAuthRef.current = unsub
    return () => {
      if (cleanupAuthRef.current) cleanupAuthRef.current()
    }
  }, [initialize])

  // When auth user changes, connect/disconnect Stream clients
  useEffect(() => {
    if (!STREAM_API_KEY) return

    let cancelled = false

    async function connect() {
      if (!user) {
        // Disconnect existing clients when user logs out
        if (chatClientRef.current) {
          await chatClientRef.current.disconnectUser()
          chatClientRef.current = null
          setStreamChatClient(null)
        }
        if (videoClientRef.current) {
          await videoClientRef.current.disconnectUser()
          videoClientRef.current = null
          setStreamVideoClient(null)
        }
        setChatToken(null)
        setVideoToken(null)
        return
      }

      try {
        const tokens = await authApi.getStreamToken()
        if (cancelled) return

        setChatToken(tokens.chatToken)
        setVideoToken(tokens.videoToken)

        // ─ Chat client ─────────────────────────────────
        const streamUser = {
          id: tokens.userId,
          name: user.user_metadata?.full_name || user.email || 'Customer',
          image: user.user_metadata?.avatar_url,
        }

        // Reuse singleton
        const chatClient = StreamChat.getInstance(STREAM_API_KEY)
        if (chatClient.userID !== tokens.userId) {
          await chatClient.connectUser(streamUser, tokens.chatToken)
        }
        if (cancelled) return

        chatClientRef.current = chatClient
        setStreamChatClient(chatClient)

        // Track unread count
        chatClient.on('notification.message_new', (event) => {
          const count = event.total_unread_count ?? 0
          setUnreadCount(count)
        })

        chatClient.on('notification.mark_read', () => {
          setUnreadCount(0)
        })

        // ─ Video client ─────────────────────────────────
        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: streamUser,
          token: tokens.videoToken,
        })
        if (cancelled) return

        videoClientRef.current = videoClient
        setStreamVideoClient(videoClient)
      } catch (err) {
        console.error('[StreamProvider] Failed to connect Stream clients:', err)
      }
    }

    connect()

    return () => {
      cancelled = true
    }
  }, [user, setStreamChatClient, setStreamVideoClient, setChatToken, setVideoToken, setUnreadCount])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chatClientRef.current) {
        chatClientRef.current.disconnectUser().catch(console.error)
      }
      if (videoClientRef.current) {
        videoClientRef.current.disconnectUser().catch(console.error)
      }
    }
  }, [])

  return <>{children}</>
}
