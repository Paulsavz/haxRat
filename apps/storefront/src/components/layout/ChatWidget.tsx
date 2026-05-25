'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import {
  MessageCircle, X, Send, Phone, Video,
  Mic, User, ArrowLeft, Paperclip,
} from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';
import { chatApi, callsApi } from '../../lib/api';
import { formatDate, cn, initials } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Message } from '../../types';

// ─── Bubble ───────────────────────────────────────────────────────────────────

function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  return (
    <div className={cn('flex items-end gap-2 mb-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {msg.sender?.name ? initials(msg.sender.name) : 'S'}
        </div>
      )}
      <div
        className={cn(
          'max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm',
          isOwn
            ? 'bg-primary-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-ink rounded-bl-sm'
        )}
      >
        {msg.type === 'system' ? (
          <p className="text-xs text-center opacity-70 italic">{msg.content}</p>
        ) : (
          <p className="leading-relaxed">{msg.content}</p>
        )}
        <p className={cn('text-[10px] mt-1 opacity-60', isOwn ? 'text-right' : 'text-left')}>
          {formatDate(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

// ─── Guest Form ───────────────────────────────────────────────────────────────

function GuestForm({ onSubmit }: { onSubmit: (name: string, phone: string) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    await onSubmit(name.trim(), phone.trim());
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <MessageCircle size={28} className="text-primary-600" />
        </div>
        <h3 className="font-semibold text-ink">Chat with us!</h3>
        <p className="text-xs text-ink-muted mt-1">
          Tell us your name and number to start chatting
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Your Name"
          placeholder="John Mensah"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          leftIcon={<User size={15} />}
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+233 20 000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          fullWidth
          leftIcon={<Phone size={15} />}
        />
        <Button type="submit" loading={loading} fullWidth>
          Start Chat
        </Button>
      </form>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function ChatWidget() {
  const { isOpen, chatId, messages, unreadCount, callStatus, toggleChat, setChatId, setMessages } =
    useChatStore();
  const { session, guest, setGuest } = useAuthStore();
  const { sendMessage, joinChat } = useSocket();
  const [text, setText] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [showCallOptions, setShowCallOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!session;
  const hasIdentity = isLoggedIn || !!guest;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && hasIdentity) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, hasIdentity]);

  // Load messages when chatId is known
  useEffect(() => {
    if (!chatId) return;
    chatApi.messages(chatId)
      .then((res) => setMessages(res.data))
      .catch(console.error);
  }, [chatId, setMessages]);

  // Start / resume chat for logged-in users
  useEffect(() => {
    if (isOpen && isLoggedIn && !chatId) {
      startChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isLoggedIn]);

  const startChat = async (name?: string, phone?: string) => {
    setIsStarting(true);
    try {
      const res = await chatApi.createOrGet(name, phone);
      const id = res.data.id;
      setChatId(id);
      joinChat(id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleGuestSubmit = async (name: string, phone: string) => {
    setGuest({ name, phone });
    await startChat(name, phone);
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !chatId) return;
    sendMessage(text.trim());
    setText('');
  };

  const handleRequestCall = async (type: 'audio' | 'video') => {
    if (!chatId) return;
    setShowCallOptions(false);
    try {
      const res = await callsApi.request(chatId, type);
      useChatStore.getState().setCall({
        callId: res.data.id,
        status: 'requesting',
        type,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // ── Floating button ────────────────────────────────────────────────────────

  const floatingBtn = (
    <button
      onClick={toggleChat}
      className={cn(
        'w-14 h-14 rounded-full shadow-float flex items-center justify-center transition-all duration-300',
        isOpen
          ? 'bg-gray-700 rotate-90'
          : 'bg-primary-600 hover:bg-primary-700 hover:scale-110'
      )}
    >
      {isOpen ? (
        <X size={22} className="text-white" />
      ) : (
        <MessageCircle size={24} className="text-white" />
      )}
      {!isOpen && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );

  // ── Chat Panel ─────────────────────────────────────────────────────────────

  const chatPanel = (
    <div
      className={cn(
        'absolute bottom-16 right-0 w-[340px] sm:w-[380px] bg-white rounded-3xl shadow-float overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right',
        isOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      )}
      style={{ maxHeight: '520px', height: '520px' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <MessageCircle size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">RetailHub Support</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span className="text-xs text-primary-200">Online</span>
          </div>
        </div>

        {/* Call options */}
        {chatId && (
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowCallOptions(!showCallOptions)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Request a call"
              >
                <Phone size={15} />
              </button>
              {showCallOptions && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lifted border border-gray-100 overflow-hidden z-10 animate-scale-in">
                  <button
                    onClick={() => handleRequestCall('audio')}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-surface-muted w-full"
                  >
                    <Mic size={15} className="text-primary-600" /> Audio Call
                  </button>
                  <button
                    onClick={() => handleRequestCall('video')}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-surface-muted w-full"
                  >
                    <Video size={15} className="text-primary-600" /> Video Call
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!hasIdentity && !isLoggedIn ? (
          // Guest form
          <div className="overflow-y-auto flex-1">
            <GuestForm onSubmit={handleGuestSubmit} />
          </div>
        ) : isStarting ? (
          // Loading
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-ink-muted">Connecting…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <p className="text-sm text-ink-muted">
                    Hi {guest?.name ?? 'there'}! How can we help you today?
                  </p>
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={
                    msg.sender_id === session?.user?.id ||
                    (msg.sender?.role === 'customer' && !msg.sender_id?.startsWith('admin'))
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 flex-shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 bg-surface-muted rounded-xl px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="w-9 h-9 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {chatPanel}
      <div className="relative">{floatingBtn}</div>
    </div>
  );
}
