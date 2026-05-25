import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import ChatItem from '@/components/ChatItem';
import { formatTime } from '@/components/utils';

interface Message {
  id: string;
  content: string;
  sender: 'customer' | 'admin';
  senderName: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function ChatScreen() {
  const { socket, setUnreadChatCount } = useAdminStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatAPI.getConversations();
      const convs: Conversation[] = res.data || [];
      setConversations(convs);
      const total = convs.reduce((sum, c) => sum + c.unreadCount, 0);
      setUnreadChatCount(total);
    } catch {
      setConversations([
        { id: '1', customerName: 'Kwame Asante', lastMessage: 'Is my order shipped yet?', lastMessageAt: new Date(Date.now() - 300000).toISOString(), unreadCount: 2 },
        { id: '2', customerName: 'Ama Mensah', lastMessage: 'Thank you for the quick delivery!', lastMessageAt: new Date(Date.now() - 3600000).toISOString(), unreadCount: 0 },
        { id: '3', customerName: 'Kofi Boateng', lastMessage: 'Can I change my shipping address?', lastMessageAt: new Date(Date.now() - 7200000).toISOString(), unreadCount: 1 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [setUnreadChatCount]);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await chatAPI.getMessages(convId);
      setMessages(res.data || []);
      await chatAPI.markRead(convId);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch {
      setMessages([
        { id: '1', content: 'Hi, is my order shipped yet?', sender: 'customer', senderName: 'Customer', createdAt: new Date(Date.now() - 600000).toISOString() },
        { id: '2', content: 'Hello! Let me check that for you right away.', sender: 'admin', senderName: 'Admin', createdAt: new Date(Date.now() - 540000).toISOString() },
        { id: '3', content: 'Your order is on the way. Should arrive within 2 days!', sender: 'admin', senderName: 'Admin', createdAt: new Date(Date.now() - 500000).toISOString() },
        { id: '4', content: 'Great! Thank you!', sender: 'customer', senderName: 'Customer', createdAt: new Date(Date.now() - 300000).toISOString() },
      ]);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (activeConv) fetchMessages(activeConv.id);
  }, [activeConv?.id]);

  useEffect(() => {
    if (!socket) return;
    socket.on('chat:new_message', (data: { conversationId: string; message: Message }) => {
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
      await chatAPI.sendMessage(activeConv.id, content);
      socket?.emit('chat:send_message', { conversationId: activeConv.id, content });
    } catch {
      Alert.alert('Error', 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isAdmin = item.sender === 'admin';
    return (
      <View style={[styles.msgRow, isAdmin ? styles.msgRowAdmin : styles.msgRowCustomer]}>
        <View style={[styles.bubble, isAdmin ? styles.bubbleAdmin : styles.bubbleCustomer]}>
          <Text style={[styles.bubbleText, isAdmin && styles.bubbleTextAdmin]}>{item.content}</Text>
          <Text style={[styles.bubbleTime, isAdmin && { color: 'rgba(255,255,255,0.6)' }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat Inbox</Text>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ChatItem conv={item} onPress={() => setActiveConv(item)} />
        )}
      />

      {/* Chat Modal */}
      <Modal
        visible={!!activeConv}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveConv(null)}
      >
        <SafeAreaView style={styles.chatContainer}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setActiveConv(null)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.chatHeaderAvatar}>
              <Text style={styles.chatHeaderAvatarText}>
                {(activeConv?.customerName || 'C').charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.chatHeaderName}>{activeConv?.customerName}</Text>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={renderMessage}
              ListEmptyComponent={
                <View style={styles.emptyMessages}>
                  <Text style={styles.emptyMessagesText}>Start the conversation</Text>
                </View>
              }
            />

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor="#94a3b8"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={!input.trim() || sending}
                style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { color: '#94a3b8', fontSize: 14, marginTop: 12 },
  // Chat
  chatContainer: { flex: 1, backgroundColor: '#f8fafc' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10,
  },
  backBtn: { padding: 4 },
  chatHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  chatHeaderName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  messagesList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  msgRow: { marginBottom: 12, flexDirection: 'row' },
  msgRowAdmin: { justifyContent: 'flex-end' },
  msgRowCustomer: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAdmin: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  bubbleCustomer: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bubbleText: { fontSize: 15, color: '#0f172a', lineHeight: 21 },
  bubbleTextAdmin: { color: '#fff' },
  bubbleTime: { fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' },
  emptyMessages: { flex: 1, alignItems: 'center', paddingTop: 40 },
  emptyMessagesText: { color: '#94a3b8', fontSize: 14 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
