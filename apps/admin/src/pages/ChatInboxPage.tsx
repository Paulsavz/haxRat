import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Phone, Video, UserCheck, Search, MoreVertical, CheckCheck } from 'lucide-react';
import { chatAPI, staffAPI, callsAPI } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/Spinner';
import { formatRelativeTime, formatTime, truncate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  sender: 'customer' | 'admin';
  senderName: string;
  createdAt: string;
  read?: boolean;
}

interface Conversation {
  id: string;
  customerName: string;
  customerPhone?: string;
  orderCount?: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  assignedTo?: { id: string; name: string };
  avatar?: string;
}

interface StaffMember {
  id: string;
  name: string;
}

export default function ChatInboxPage() {
  const { socket, setUnreadChatCount } = useAdminStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatAPI.getConversations();
      const convs: Conversation[] = res.data || [];
      setConversations(convs);
      const total = convs.reduce((sum, c) => sum + c.unreadCount, 0);
      setUnreadChatCount(total);
    } catch {
      // Placeholder data
      setConversations([
        { id: '1', customerName: 'Kwame Asante', customerPhone: '+233244123456', orderCount: 5, lastMessage: 'Is my order shipped yet?', lastMessageAt: new Date(Date.now() - 300000).toISOString(), unreadCount: 2 },
        { id: '2', customerName: 'Ama Mensah', customerPhone: '+233205678901', orderCount: 2, lastMessage: 'Thank you for the quick delivery!', lastMessageAt: new Date(Date.now() - 3600000).toISOString(), unreadCount: 0 },
        { id: '3', customerName: 'Kofi Boateng', customerPhone: '+233209876543', orderCount: 8, lastMessage: 'Can I change my shipping address?', lastMessageAt: new Date(Date.now() - 7200000).toISOString(), unreadCount: 1 },
        { id: '4', customerName: 'Abena Ofori', customerPhone: '+233557890123', orderCount: 1, lastMessage: 'Hi, I need help with my order', lastMessageAt: new Date(Date.now() - 86400000).toISOString(), unreadCount: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [setUnreadChatCount]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setMsgLoading(true);
    try {
      const res = await chatAPI.getMessages(conversationId);
      setMessages(res.data || []);
      await chatAPI.markRead(conversationId);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    } catch {
      setMessages([
        { id: '1', content: 'Hi, is my order #ORD-001 shipped yet?', sender: 'customer', senderName: activeConv?.customerName || 'Customer', createdAt: new Date(Date.now() - 600000).toISOString() },
        { id: '2', content: 'Hello! Let me check that for you right away.', sender: 'admin', senderName: 'Support', createdAt: new Date(Date.now() - 540000).toISOString() },
        { id: '3', content: 'Your order has been dispatched and should arrive within 2 days. Tracking: GH12345678', sender: 'admin', senderName: 'Support', createdAt: new Date(Date.now() - 500000).toISOString() },
        { id: '4', content: 'Great! Thank you so much!', sender: 'customer', senderName: activeConv?.customerName || 'Customer', createdAt: new Date(Date.now() - 300000).toISOString() },
      ]);
    } finally {
      setMsgLoading(false);
    }
  }, [activeConv?.customerName]);

  const fetchStaff = async () => {
    try {
      const res = await staffAPI.list();
      setStaff(res.data || []);
    } catch {
      setStaff([{ id: '1', name: 'Agent Kofi' }, { id: '2', name: 'Agent Ama' }]);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchStaff();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConv) fetchMessages(activeConv.id);
  }, [activeConv?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('chat:new_message', (data: { conversationId: string; message: Message; customerName: string }) => {
      if (activeConv?.id === data.conversationId) {
        setMessages((prev) => [...prev, data.message]);
        chatAPI.markRead(data.conversationId).catch(() => {});
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === data.conversationId
              ? { ...c, lastMessage: data.message.content, lastMessageAt: data.message.createdAt, unreadCount: c.unreadCount + 1 }
              : c
          )
        );
        try {
          const audio = new Audio('/sounds/message.mp3');
          audio.volume = 0.4;
          audio.play().catch(() => {});
        } catch {}
      }
    });

    socket.on('chat:conversation_new', fetchConversations);

    return () => {
      socket.off('chat:new_message');
      socket.off('chat:conversation_new');
    };
  }, [socket, activeConv?.id, fetchConversations]);

  const handleSend = async () => {
    if (!input.trim() || !activeConv || sending) return;
    const content = input.trim();
    setInput('');

    const tempMsg: Message = {
      id: `temp_${Date.now()}`,
      content,
      sender: 'admin',
      senderName: 'You',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    setSending(true);
    try {
      const res = await chatAPI.sendMessage(activeConv.id, content);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? (res.data || tempMsg) : m))
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
      socket?.emit('chat:send_message', { conversationId: activeConv.id, content });
    } catch {
      toast.error('Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleAssign = async (staffId: string) => {
    if (!activeConv) return;
    try {
      await chatAPI.assignStaff(activeConv.id, staffId);
      const assignedMember = staff.find((s) => s.id === staffId);
      setActiveConv((prev) => prev ? { ...prev, assignedTo: assignedMember ? { id: assignedMember.id, name: assignedMember.name } : undefined } : prev);
      toast.success(`Assigned to ${assignedMember?.name}`);
    } catch {
      toast.error('Failed to assign staff');
    }
  };

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (!activeConv) return;
    try {
      const res = await callsAPI.initiateCall(activeConv.id, type);
      if (res.data?.roomUrl) window.open(res.data.roomUrl, '_blank', 'width=800,height=600');
      toast.success(`${type === 'video' ? 'Video' : 'Voice'} call initiated`);
    } catch {
      toast.error('Failed to start call');
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.customerName.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel: Conversation List */}
      <div className={cn(
        'w-80 shrink-0 border-r border-slate-200 flex flex-col bg-white',
        activeConv ? 'hidden md:flex' : 'flex'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Inbox</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredConversations
              .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
              .map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-50',
                    activeConv?.id === conv.id && 'bg-brand-50 border-brand-100 hover:bg-brand-50'
                  )}
                >
                  <div className="relative">
                    <Avatar name={conv.customerName} src={conv.avatar} size="md" />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={cn('text-sm font-semibold', conv.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700')}>
                        {conv.customerName}
                      </p>
                      <span className="text-xs text-slate-400 shrink-0">{formatRelativeTime(conv.lastMessageAt)}</span>
                    </div>
                    <p className={cn('text-xs truncate', conv.unreadCount > 0 ? 'text-slate-800 font-medium' : 'text-slate-500')}>
                      {truncate(conv.lastMessage, 45)}
                    </p>
                  </div>
                </button>
              ))
          )}
        </div>
      </div>

      {/* Right Panel: Chat Thread */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          {/* Chat Header */}
          <div className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-5 shrink-0">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setActiveConv(null)}
            >
              ←
            </button>
            <Avatar name={activeConv.customerName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm">{activeConv.customerName}</p>
              <p className="text-xs text-slate-500">
                {activeConv.customerPhone && `${activeConv.customerPhone} · `}
                {activeConv.orderCount !== undefined && `${activeConv.orderCount} orders`}
                {activeConv.assignedTo && ` · Assigned: ${activeConv.assignedTo.name}`}
              </p>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => handleStartCall('audio')} title="Voice call">
                <Phone size={17} />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleStartCall('video')} title="Video call">
                <Video size={17} />
              </Button>
              <div className="relative group">
                <Button size="icon" variant="ghost">
                  <UserCheck size={17} />
                </Button>
                {/* Assign dropdown */}
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                  <p className="text-xs font-semibold text-slate-400 px-3 py-2 border-b border-slate-100">Assign to</p>
                  {staff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleAssign(s.id)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <Button size="icon" variant="ghost">
                <MoreVertical size={17} />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {msgLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingScreen />
              </div>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={msg.id} className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}>
                    {!isAdmin && (
                      <Avatar name={msg.senderName} size="sm" className="mr-2 mt-auto shrink-0" />
                    )}
                    <div className={cn('max-w-xs lg:max-w-md group', isAdmin ? 'items-end' : 'items-start', 'flex flex-col')}>
                      {!isAdmin && (
                        <p className="text-xs text-slate-400 mb-1 ml-1">{msg.senderName}</p>
                      )}
                      <div className={cn(
                        'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                        isAdmin
                          ? 'bg-brand-500 text-white rounded-br-sm'
                          : 'bg-white text-slate-900 rounded-bl-sm shadow-sm border border-slate-100'
                      )}>
                        {msg.content}
                      </div>
                      <div className={cn('flex items-center gap-1 mt-1 px-1', isAdmin ? 'justify-end' : 'justify-start')}>
                        <span className="text-xs text-slate-400">{formatTime(msg.createdAt)}</span>
                        {isAdmin && <CheckCheck size={12} className="text-brand-300" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-slate-200 p-4 shrink-0">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-10 max-h-32"
                style={{ overflowY: 'auto' }}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="h-10 w-10 p-0 rounded-xl shrink-0"
              >
                <Send size={16} />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      ) : (
        /* Empty state - no conversation selected */
        <div className="flex-1 hidden md:flex flex-col items-center justify-center text-slate-400 bg-slate-50">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Send size={28} className="text-slate-300" />
          </div>
          <p className="font-medium text-slate-500">Select a conversation</p>
          <p className="text-sm mt-1">Choose from the list to start chatting</p>
        </div>
      )}
    </div>
  );
}
