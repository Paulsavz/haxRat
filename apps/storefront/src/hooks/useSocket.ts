'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import type { Message } from '../types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

let socketInstance: Socket | null = null;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { chatId, addMessage, setConnected, setCall, incrementUnread, isOpen } = useChatStore();
  const { session, guest } = useAuthStore();

  const connect = useCallback(() => {
    if (socketInstance?.connected) {
      socketRef.current = socketInstance;
      return;
    }

    const token = session?.access_token;
    const socket = io(SOCKET_URL, {
      auth: {
        token,
        guestName: guest?.name,
        guestPhone: guest?.phone,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      setConnected(true);
      // Re-join chat room if we have a chatId
      if (chatId) {
        socket.emit('join_chat', { chatId });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('reconnect', () => {
      setConnected(true);
      if (chatId) {
        socket.emit('join_chat', { chatId });
      }
    });

    socket.on('new_message', (msg: Message) => {
      addMessage(msg);
      if (!isOpen) {
        incrementUnread();
      }
    });

    socket.on('call_accepted', (call: { id: string; room_url: string; room_token: string; type: 'audio' | 'video' }) => {
      setCall({
        callId: call.id,
        status: 'active',
        type: call.type,
        roomUrl: call.room_url,
        roomToken: call.room_token,
      });
    });

    socket.on('call_declined', () => {
      setCall(null);
    });

    socket.on('call_ended', () => {
      setCall(null);
    });

    socketInstance = socket;
    socketRef.current = socket;
  }, [session, guest, chatId, addMessage, setConnected, setCall, incrementUnread, isOpen]);

  const disconnect = useCallback(() => {
    socketInstance?.disconnect();
    socketInstance = null;
    socketRef.current = null;
    setConnected(false);
  }, [setConnected]);

  const sendMessage = useCallback(
    (content: string, type: 'text' | 'image' | 'file' = 'text') => {
      if (!socketRef.current || !chatId) return;
      socketRef.current.emit('send_message', { chatId, content, type });
    },
    [chatId]
  );

  const joinChat = useCallback(
    (id: string) => {
      socketRef.current?.emit('join_chat', { chatId: id });
    },
    []
  );

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      // Don't disconnect on unmount — keep socket alive across pages
    };
  }, [connect]);

  // Re-join chat when chatId changes
  useEffect(() => {
    if (chatId && socketRef.current?.connected) {
      socketRef.current.emit('join_chat', { chatId });
    }
  }, [chatId]);

  return { socket: socketRef.current, sendMessage, joinChat, connect, disconnect };
}

export function getSocket(): Socket | null {
  return socketInstance;
}
