import { create } from 'zustand'
import type { StreamChat } from 'stream-chat'
import type { StreamVideoClient } from '@stream-io/video-react-sdk'

export type ActiveTab = 'chat' | 'audio' | 'video'

interface GuestInfo {
  id: string
  name: string
  phone: string
  chatToken: string
  videoToken: string
}

interface CommunicationState {
  // Clients
  streamChatClient: StreamChat | null
  streamVideoClient: StreamVideoClient | null

  // Tokens
  chatToken: string | null
  videoToken: string | null

  // Widget state
  isWidgetOpen: boolean
  activeTab: ActiveTab
  unreadCount: number

  // Guest info (when not logged in)
  guestInfo: GuestInfo | null

  // Setters
  setStreamChatClient: (client: StreamChat | null) => void
  setStreamVideoClient: (client: StreamVideoClient | null) => void
  setChatToken: (token: string | null) => void
  setVideoToken: (token: string | null) => void
  setIsWidgetOpen: (open: boolean) => void
  setActiveTab: (tab: ActiveTab) => void
  setUnreadCount: (count: number) => void
  setGuestInfo: (info: GuestInfo | null) => void
  toggleWidget: () => void
  openWidget: (tab?: ActiveTab) => void
}

export const useCommunicationStore = create<CommunicationState>((set, get) => ({
  streamChatClient: null,
  streamVideoClient: null,
  chatToken: null,
  videoToken: null,
  isWidgetOpen: false,
  activeTab: 'chat',
  unreadCount: 0,
  guestInfo: null,

  setStreamChatClient: (client) => set({ streamChatClient: client }),
  setStreamVideoClient: (client) => set({ streamVideoClient: client }),
  setChatToken: (token) => set({ chatToken: token }),
  setVideoToken: (token) => set({ videoToken: token }),
  setIsWidgetOpen: (open) => set({ isWidgetOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setGuestInfo: (info) => set({ guestInfo: info }),

  toggleWidget: () => set((state) => ({ isWidgetOpen: !state.isWidgetOpen })),

  openWidget: (tab) => {
    const update: Partial<CommunicationState> = { isWidgetOpen: true }
    if (tab) update.activeTab = tab
    set(update)
    void get // suppress unused warning
  },
}))
