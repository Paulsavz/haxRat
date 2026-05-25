import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface CallRequest {
  id: string;
  customerId: string;
  customerName: string;
  callType: 'audio' | 'video';
  roomUrl?: string;
  timestamp: string;
}

interface AdminStore {
  admin: Admin | null;
  token: string | null;
  socket: Socket | null;
  pendingCallRequests: CallRequest[];
  unreadChatCount: number;
  pendingOrdersCount: number;
  isLoading: boolean;

  setAdmin: (admin: Admin | null) => void;
  setToken: (token: string | null) => Promise<void>;
  logout: () => Promise<void>;
  initSocket: () => void;
  disconnectSocket: () => void;
  addCallRequest: (call: CallRequest) => void;
  removeCallRequest: (callId: string) => void;
  setUnreadChatCount: (count: number) => void;
  incrementUnreadChat: () => void;
  setPendingOrdersCount: (count: number) => void;
  loadPersistedState: () => Promise<void>;
}

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api').replace('/api', '');

export const useAdminStore = create<AdminStore>((set, get) => ({
  admin: null,
  token: null,
  socket: null,
  pendingCallRequests: [],
  unreadChatCount: 0,
  pendingOrdersCount: 0,
  isLoading: true,

  loadPersistedState: async () => {
    try {
      const [token, adminStr] = await AsyncStorage.multiGet(['admin_token', 'admin_user']);
      const savedToken = token[1];
      const savedAdmin = adminStr[1] ? JSON.parse(adminStr[1]) : null;
      set({ token: savedToken, admin: savedAdmin, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setAdmin: (admin) => {
    set({ admin });
    if (admin) {
      AsyncStorage.setItem('admin_user', JSON.stringify(admin)).catch(() => {});
    } else {
      AsyncStorage.removeItem('admin_user').catch(() => {});
    }
  },

  setToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem('admin_token', token);
    } else {
      await AsyncStorage.removeItem('admin_token');
    }
    set({ token });
  },

  logout: async () => {
    get().disconnectSocket();
    await AsyncStorage.multiRemove(['admin_token', 'admin_user']);
    set({
      admin: null,
      token: null,
      socket: null,
      pendingCallRequests: [],
      unreadChatCount: 0,
      pendingOrdersCount: 0,
    });
  },

  initSocket: () => {
    const { socket, token } = get();
    if (socket?.connected) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token: token || '' },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      newSocket.emit('admin:join');
    });

    newSocket.on('chat:new_message', () => {
      get().incrementUnreadChat();
    });

    newSocket.on('order:new', () => {
      set((s) => ({ pendingOrdersCount: s.pendingOrdersCount + 1 }));
    });

    newSocket.on('call:incoming', (callData: CallRequest) => {
      set((s) => ({
        pendingCallRequests: [...s.pendingCallRequests, callData],
      }));
    });

    newSocket.on('call:accepted', (data: { callId: string }) => {
      get().removeCallRequest(data.callId);
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  addCallRequest: (call) =>
    set((s) => ({ pendingCallRequests: [...s.pendingCallRequests, call] })),

  removeCallRequest: (callId) =>
    set((s) => ({
      pendingCallRequests: s.pendingCallRequests.filter((c) => c.id !== callId),
    })),

  setUnreadChatCount: (count) => set({ unreadChatCount: count }),
  incrementUnreadChat: () => set((s) => ({ unreadChatCount: s.unreadChatCount + 1 })),
  setPendingOrdersCount: (count) => set({ pendingOrdersCount: count }),
}));
