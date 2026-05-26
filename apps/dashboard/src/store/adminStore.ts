import { create } from 'zustand'
import type { StreamChat, Channel } from 'stream-chat'
import type { StreamVideoClient, Call } from '@stream-io/video-react-sdk'

export interface AdminUser {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: string
}

export interface IncomingCall {
  call: Call
  callerName: string
  callerAvatar?: string
  callType: 'audio' | 'video'
  callId: string
}

export interface ActiveCall {
  call: Call
  callType: 'audio' | 'video'
  channelId?: string
}

interface AdminStore {
  // Auth
  admin: AdminUser | null
  token: string | null

  // Stream Chat
  streamChatClient: StreamChat | null
  activeChannel: Channel | null
  unreadChatCount: number

  // Stream Video
  streamVideoClient: StreamVideoClient | null
  incomingCall: IncomingCall | null
  activeCall: ActiveCall | null

  // Orders
  pendingOrdersCount: number

  // UI
  sidebarCollapsed: boolean

  // Actions
  setAdmin: (admin: AdminUser | null) => void
  setToken: (token: string | null) => void
  setStreamChatClient: (client: StreamChat | null) => void
  setStreamVideoClient: (client: StreamVideoClient | null) => void
  setActiveChannel: (channel: Channel | null) => void
  setUnreadChatCount: (count: number) => void
  setIncomingCall: (call: IncomingCall | null) => void
  setActiveCall: (call: ActiveCall | null) => void
  setPendingOrdersCount: (count: number) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  reset: () => void
}

const initialState = {
  admin: null,
  token: null,
  streamChatClient: null,
  activeChannel: null,
  unreadChatCount: 0,
  streamVideoClient: null,
  incomingCall: null,
  activeCall: null,
  pendingOrdersCount: 0,
  sidebarCollapsed: false,
}

export const useAdminStore = create<AdminStore>((set) => ({
  ...initialState,

  setAdmin: (admin) => set({ admin }),
  setToken: (token) => set({ token }),
  setStreamChatClient: (client) => set({ streamChatClient: client }),
  setStreamVideoClient: (client) => set({ streamVideoClient: client }),
  setActiveChannel: (channel) => set({ activeChannel: channel }),
  setUnreadChatCount: (count) => set({ unreadChatCount: count }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  setActiveCall: (call) => set({ activeCall: call }),
  setPendingOrdersCount: (count) => set({ pendingOrdersCount: count }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  reset: () => set(initialState),
}))
