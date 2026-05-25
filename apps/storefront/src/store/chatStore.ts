import { create } from 'zustand';
import type { Message } from '../types';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface ChatState {
  chatId: string | null;
  messages: Message[];
  isOpen: boolean;
  isConnected: boolean;
  unreadCount: number;
  callId: string | null;
  callStatus: 'idle' | 'requesting' | 'active' | 'ended';
  callType: 'audio' | 'video' | null;
  callRoomUrl: string | null;
  callRoomToken: string | null;

  // Actions
  setChatId: (id: string) => void;
  addMessage: (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  markRead: () => void;
  incrementUnread: () => void;
  setConnected: (connected: boolean) => void;
  setCall: (call: {
    callId: string;
    status: 'requesting' | 'active' | 'ended';
    type: 'audio' | 'video';
    roomUrl?: string;
    roomToken?: string;
  } | null) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>()((set) => ({
  chatId: null,
  messages: [],
  isOpen: false,
  isConnected: false,
  unreadCount: 0,
  callId: null,
  callStatus: 'idle',
  callType: null,
  callRoomUrl: null,
  callRoomToken: null,

  setChatId(id) {
    set({ chatId: id });
  },

  addMessage(msg) {
    set((state) => {
      // Deduplicate
      if (state.messages.some((m) => m.id === msg.id)) return state;
      return { messages: [...state.messages, msg] };
    });
  },

  setMessages(msgs) {
    set({ messages: msgs });
  },

  openChat() {
    set({ isOpen: true, unreadCount: 0 });
  },

  closeChat() {
    set({ isOpen: false });
  },

  toggleChat() {
    set((state) => ({
      isOpen: !state.isOpen,
      unreadCount: !state.isOpen ? 0 : state.unreadCount,
    }));
  },

  markRead() {
    set({ unreadCount: 0 });
  },

  incrementUnread() {
    set((state) => ({
      unreadCount: state.isOpen ? 0 : state.unreadCount + 1,
    }));
  },

  setConnected(connected) {
    set({ isConnected: connected });
  },

  setCall(call) {
    if (!call) {
      set({
        callId: null,
        callStatus: 'idle',
        callType: null,
        callRoomUrl: null,
        callRoomToken: null,
      });
    } else {
      set({
        callId: call.callId,
        callStatus: call.status,
        callType: call.type,
        callRoomUrl: call.roomUrl ?? null,
        callRoomToken: call.roomToken ?? null,
      });
    }
  },
}));
