import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

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

export interface ActiveCall {
  id: string;
  customerId: string;
  customerName: string;
  callType: 'audio' | 'video';
  roomUrl: string;
  startedAt: string;
}

interface AdminStore {
  admin: Admin | null;
  token: string | null;
  socket: Socket | null;
  pendingCallRequests: CallRequest[];
  activeCalls: ActiveCall[];
  unreadChatCount: number;
  pendingOrdersCount: number;

  setAdmin: (admin: Admin | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  initSocket: () => void;
  disconnectSocket: () => void;
  addCallRequest: (call: CallRequest) => void;
  removeCallRequest: (callId: string) => void;
  addActiveCall: (call: ActiveCall) => void;
  removeActiveCall: (callId: string) => void;
  setUnreadChatCount: (count: number) => void;
  incrementUnreadChat: () => void;
  setPendingOrdersCount: (count: number) => void;
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      socket: null,
      pendingCallRequests: [],
      activeCalls: [],
      unreadChatCount: 0,
      pendingOrdersCount: 0,

      setAdmin: (admin) => set({ admin }),
      setToken: (token) => {
        if (token) localStorage.setItem('admin_token', token);
        else localStorage.removeItem('admin_token');
        set({ token });
      },

      logout: () => {
        get().disconnectSocket();
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        set({ admin: null, token: null, socket: null, pendingCallRequests: [], activeCalls: [] });
      },

      initSocket: () => {
        const { socket, token } = get();
        if (socket?.connected) return;

        const newSocket = io(SOCKET_URL, {
          auth: { token: token || localStorage.getItem('admin_token') },
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });

        newSocket.on('connect', () => {
          console.log('[Socket] Connected:', newSocket.id);
          newSocket.emit('admin:join');
        });

        newSocket.on('disconnect', () => {
          console.log('[Socket] Disconnected');
        });

        // New chat message
        newSocket.on('chat:new_message', (data) => {
          const { pathname } = window.location;
          if (!pathname.includes('/chat')) {
            get().incrementUnreadChat();
            // Play notification sound
            try {
              const audio = new Audio('/sounds/message.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch {}
            toast(`New message from ${data.customerName}`, {
              icon: '💬',
              duration: 4000,
            });
          }
        });

        // New order
        newSocket.on('order:new', (data) => {
          set((s) => ({ pendingOrdersCount: s.pendingOrdersCount + 1 }));
          toast.success(`New order #${data.orderNumber} received!`, { duration: 5000 });
        });

        // Incoming call
        newSocket.on('call:incoming', (callData: CallRequest) => {
          set((s) => ({
            pendingCallRequests: [...s.pendingCallRequests, callData],
          }));
          try {
            const audio = new Audio('/sounds/ringtone.mp3');
            audio.loop = true;
            audio.volume = 0.8;
            (audio as unknown as { _callId: string })._callId = callData.id;
            audio.play().catch(() => {});
            (window as unknown as Record<string, unknown>)[`ringtone_${callData.id}`] = audio;
          } catch {}
        });

        // Call accepted (by another admin)
        newSocket.on('call:accepted', (data: { callId: string }) => {
          get().removeCallRequest(data.callId);
        });

        // Call ended
        newSocket.on('call:ended', (data: { callId: string }) => {
          get().removeActiveCall(data.callId);
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

      removeCallRequest: (callId) => {
        // Stop ringtone
        const ringtone = (window as unknown as Record<string, unknown>)[`ringtone_${callId}`] as HTMLAudioElement | undefined;
        if (ringtone) {
          ringtone.pause();
          delete (window as unknown as Record<string, unknown>)[`ringtone_${callId}`];
        }
        set((s) => ({
          pendingCallRequests: s.pendingCallRequests.filter((c) => c.id !== callId),
        }));
      },

      addActiveCall: (call) =>
        set((s) => ({ activeCalls: [...s.activeCalls, call] })),

      removeActiveCall: (callId) =>
        set((s) => ({ activeCalls: s.activeCalls.filter((c) => c.id !== callId) })),

      setUnreadChatCount: (count) => set({ unreadChatCount: count }),
      incrementUnreadChat: () => set((s) => ({ unreadChatCount: s.unreadChatCount + 1 })),
      setPendingOrdersCount: (count) => set({ pendingOrdersCount: count }),
    }),
    {
      name: 'admin-store',
      partialize: (state) => ({ admin: state.admin, token: state.token }),
    }
  )
);
