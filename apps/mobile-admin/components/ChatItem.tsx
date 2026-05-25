import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatRelativeTime } from './utils';

interface Conversation {
  id: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function ChatItem({ conv, onPress }: { conv: Conversation; onPress?: () => void }) {
  const initials = conv.customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const color = colors[conv.customerName.charCodeAt(0) % colors.length];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.initials}>{initials}</Text>
        {conv.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, conv.unreadCount > 0 && styles.nameBold]}>
            {conv.customerName}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(conv.lastMessageAt)}</Text>
        </View>
        <Text
          style={[styles.lastMessage, conv.unreadCount > 0 && styles.lastMessageBold]}
          numberOfLines={1}
        >
          {conv.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500',
  },
  nameBold: {
    color: '#0f172a',
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    color: '#94a3b8',
  },
  lastMessage: {
    fontSize: 13,
    color: '#94a3b8',
  },
  lastMessageBold: {
    color: '#475569',
    fontWeight: '500',
  },
});
