import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { StreamChat } from 'stream-chat'
import { StreamVideoClient, Call } from '@stream-io/video-react-native-sdk'

interface AdminUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: string
}

interface AdminState {
  // Auth
  admin: AdminUser | null
  token: string | null
  streamToken: string | null

  // Stream clients (not persisted — reconstructed on app start)
  streamChatClient: StreamChat | null
  streamVideoClient: StreamVideoClient | null

  // Call state
  incomingCalls: Call[]
  activeCall: Call | null

  // Badge counts
  unreadCount: number
  pendingOrdersCount: number

  // Actions
  setAdmin: (admin: AdminUser | null) => void
  setToken: (token: string | null) => void
  setStreamToken: (token: string | null) => void
  setStreamChatClient: (client: StreamChat | null) => void
  setStreamVideoClient: (client: StreamVideoClient | null) => void
  setIncomingCalls: (calls: Call[]) => void
  setActiveCall: (call: Call | null) => void
  setUnreadCount: (count: number) => void
  setPendingOrdersCount: (count: number) => void
  logout: () => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      streamToken: null,
      streamChatClient: null,
      streamVideoClient: null,
      incomingCalls: [],
      activeCall: null,
      unreadCount: 0,
      pendingOrdersCount: 0,

      setAdmin: (admin) => set({ admin }),
      setToken: (token) => set({ token }),
      setStreamToken: (streamToken) => set({ streamToken }),
      setStreamChatClient: (streamChatClient) => set({ streamChatClient }),
      setStreamVideoClient: (streamVideoClient) => set({ streamVideoClient }),
      setIncomingCalls: (incomingCalls) => set({ incomingCalls }),
      setActiveCall: (activeCall) => set({ activeCall }),
      setUnreadCount: (unreadCount) => set({ unreadCount }),
      setPendingOrdersCount: (pendingOrdersCount) => set({ pendingOrdersCount }),

      logout: () =>
        set({
          admin: null,
          token: null,
          streamToken: null,
          streamChatClient: null,
          streamVideoClient: null,
          incomingCalls: [],
          activeCall: null,
          unreadCount: 0,
          pendingOrdersCount: 0,
        }),
    }),
    {
      name: 'retailhub-admin-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Stream client instances are not serialisable — exclude them
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        streamToken: state.streamToken,
        unreadCount: state.unreadCount,
        pendingOrdersCount: state.pendingOrdersCount,
      }),
    }
  )
)
