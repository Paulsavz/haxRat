'use client'

import { useEffect, useRef } from 'react'
import { StreamChat } from 'stream-chat'
import { StreamVideoClient } from '@stream-io/video-react-sdk'
import { useAdminStore } from '@/store/adminStore'
import { getSupabaseClient } from '@/lib/supabase'
import apiClient from '@/lib/api'

interface StreamTokenResponse {
  chatToken: string
  videoToken: string
  userId: string
  userName: string
  userEmail: string
  avatarUrl?: string
}

export default function StreamAdminProvider({ children }: { children: React.ReactNode }) {
  const {
    setAdmin,
    setStreamChatClient,
    setStreamVideoClient,
    setUnreadChatCount,
    setIncomingCall,
    streamChatClient,
    streamVideoClient,
  } = useAdminStore()

  const chatClientRef = useRef<StreamChat | null>(null)
  const videoClientRef = useRef<StreamVideoClient | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    async function initStream() {
      try {
        const supabase = getSupabaseClient()
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !sessionData.session) {
          console.warn('No active session, skipping Stream init')
          return
        }

        const user = sessionData.session.user
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!

        if (!apiKey) {
          console.warn('NEXT_PUBLIC_STREAM_API_KEY not configured')
          return
        }

        // Fetch Stream tokens from API
        let tokenData: StreamTokenResponse
        try {
          const res = await apiClient.get<StreamTokenResponse>('/auth/stream-token')
          tokenData = res.data
        } catch (err) {
          console.warn('Could not fetch Stream tokens:', err)
          // Gracefully degrade — admin can still use the app without chat/video
          return
        }

        const adminUser = {
          id: tokenData.userId,
          email: tokenData.userEmail,
          name: tokenData.userName,
          avatar_url: tokenData.avatarUrl,
          role: 'admin',
        }
        setAdmin(adminUser)

        // Initialize Stream Chat
        const chatClient = StreamChat.getInstance(apiKey)
        if (!chatClient.userID) {
          await chatClient.connectUser(
            {
              id: tokenData.userId,
              name: tokenData.userName,
              image: tokenData.avatarUrl,
              role: 'admin',
            },
            tokenData.chatToken
          )
        }

        chatClientRef.current = chatClient
        setStreamChatClient(chatClient)

        // Listen for total unread count updates
        chatClient.on('notification.mark_read', () => {
          setUnreadChatCount(Number(chatClient.user?.total_unread_count ?? 0))
        })
        chatClient.on('message.new', () => {
          setUnreadChatCount(Number(chatClient.user?.total_unread_count ?? 0))
        })
        chatClient.on('notification.message_new', () => {
          setUnreadChatCount(Number(chatClient.user?.total_unread_count ?? 0))
        })

        // Set initial unread count
        setUnreadChatCount(Number(chatClient.user?.total_unread_count ?? 0))

        // Initialize Stream Video
        const videoClient = new StreamVideoClient({
          apiKey,
          user: {
            id: tokenData.userId,
            name: tokenData.userName,
            image: tokenData.avatarUrl,
          },
          token: tokenData.videoToken,
        })

        videoClientRef.current = videoClient
        setStreamVideoClient(videoClient)

        // Listen for incoming calls
        videoClient.on('call.ring', (event) => {
          const call = event.call
          if (!call) return

          // Determine call type from call ID or custom data
          const isVideo = call.type === 'default' || call.id?.includes('video')
          const callType: 'audio' | 'video' = isVideo ? 'video' : 'audio'

          // Get caller info from members
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const callAny = call as any
          const callerMember = callAny.state?.members
            ? Object.values(callAny.state.members).find(
                (m: any) => m.user_id !== tokenData.userId
              )
            : null

          const callerName =
            (callerMember as any)?.user?.name ||
            (callerMember as any)?.user_id ||
            'Customer'
          const callerAvatar = (callerMember as any)?.user?.image

          setIncomingCall({
            call: call as any,
            callerName,
            callerAvatar,
            callType,
            callId: call.id,
          })
        })
      } catch (err) {
        console.error('Failed to initialize Stream clients:', err)
      }
    }

    initStream()

    return () => {
      // Cleanup on unmount
      if (chatClientRef.current) {
        chatClientRef.current.disconnectUser().catch(console.error)
        chatClientRef.current = null
      }
      if (videoClientRef.current) {
        videoClientRef.current.disconnectUser().catch(console.error)
        videoClientRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
