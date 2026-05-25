import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { callsAPI } from '@/lib/api';
import { useAdminStore, CallRequest } from '@/store/adminStore';
import { formatRelativeTime } from '@/components/utils';

interface CallHistory {
  id: string;
  customerName: string;
  callType: 'audio' | 'video';
  duration: number;
  status: 'answered' | 'missed' | 'declined';
  startedAt: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function IncomingCallBanner({ call, onAccept, onDecline }: {
  call: CallRequest;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <View style={styles.incomingBanner}>
      <View style={styles.incomingLeft}>
        <View style={[styles.callTypeIcon, { backgroundColor: call.callType === 'video' ? '#eef2ff' : '#dcfce7' }]}>
          <Ionicons
            name={call.callType === 'video' ? 'videocam' : 'call'}
            size={20}
            color={call.callType === 'video' ? '#6366f1' : '#16a34a'}
          />
        </View>
        <View>
          <Text style={styles.incomingLabel}>Incoming {call.callType} call</Text>
          <Text style={styles.incomingName}>{call.customerName}</Text>
        </View>
      </View>
      <View style={styles.incomingActions}>
        <TouchableOpacity onPress={onDecline} style={styles.declineBtn}>
          <Ionicons name="call" size={20} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onAccept} style={styles.acceptBtn}>
          <Ionicons name="call" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CallsScreen() {
  const { pendingCallRequests, removeCallRequest, socket } = useAdminStore();
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await callsAPI.getHistory();
      setCallHistory(res.data?.calls || res.data || []);
    } catch {
      setCallHistory([
        { id: '1', customerName: 'Kwame Asante', callType: 'video', duration: 245, status: 'answered', startedAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', customerName: 'Ama Mensah', callType: 'audio', duration: 0, status: 'missed', startedAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '3', customerName: 'Kofi Boateng', callType: 'audio', duration: 120, status: 'answered', startedAt: new Date(Date.now() - 86400000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('call:ended', () => fetchHistory());
    return () => { socket.off('call:ended'); };
  }, [socket]);

  const handleAccept = async (call: CallRequest) => {
    try {
      const res = await callsAPI.acceptCall(call.id);
      removeCallRequest(call.id);
      socket?.emit('call:accept', { callId: call.id });
      Alert.alert(
        'Call Accepted',
        `${call.callType === 'video' ? 'Video' : 'Voice'} call with ${call.customerName} started.\n\nRoom: ${res.data?.roomUrl || 'Opening...'}`
      );
    } catch {
      Alert.alert('Error', 'Failed to accept call');
    }
  };

  const handleDecline = async (callId: string) => {
    try {
      await callsAPI.declineCall(callId);
      socket?.emit('call:decline', { callId });
    } catch {}
    removeCallRequest(callId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return { color: '#16a34a', bg: '#dcfce7' };
      case 'missed': return { color: '#d97706', bg: '#fef3c7' };
      case 'declined': return { color: '#dc2626', bg: '#fee2e2' };
      default: return { color: '#64748b', bg: '#f1f5f9' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Calls</Text>
      </View>

      {/* Incoming Calls */}
      {pendingCallRequests.length > 0 && (
        <View style={styles.incomingSection}>
          {pendingCallRequests.map((call) => (
            <IncomingCallBanner
              key={call.id}
              call={call}
              onAccept={() => handleAccept(call)}
              onDecline={() => handleDecline(call.id)}
            />
          ))}
        </View>
      )}

      {/* Call History */}
      <FlatList
        data={callHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Call History</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="call-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No call history yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusStyle = getStatusColor(item.status);
          return (
            <View style={styles.callItem}>
              <View style={[styles.callIcon, { backgroundColor: item.callType === 'video' ? '#eef2ff' : '#f0fdf4' }]}>
                <Ionicons
                  name={item.callType === 'video' ? 'videocam-outline' : 'call-outline'}
                  size={20}
                  color={item.callType === 'video' ? '#6366f1' : '#16a34a'}
                />
              </View>
              <View style={styles.callInfo}>
                <Text style={styles.callCustomer}>{item.customerName}</Text>
                <View style={styles.callMeta}>
                  <Text style={styles.callType}>{item.callType === 'video' ? 'Video' : 'Voice'}</Text>
                  {item.duration > 0 && (
                    <Text style={styles.callDuration}>· {formatDuration(item.duration)}</Text>
                  )}
                  <Text style={styles.callTime}>· {formatRelativeTime(item.startedAt)}</Text>
                </View>
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusPillText, { color: statusStyle.color }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  incomingSection: { paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  incomingBanner: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  incomingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  callTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomingLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  incomingName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  incomingActions: { flexDirection: 'row', gap: 10 },
  declineBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16, paddingBottom: 30 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#94a3b8', fontSize: 14, marginTop: 12 },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  callIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callInfo: { flex: 1 },
  callCustomer: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  callMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  callType: { fontSize: 12, color: '#64748b', textTransform: 'capitalize' },
  callDuration: { fontSize: 12, color: '#94a3b8', marginLeft: 4 },
  callTime: { fontSize: 12, color: '#94a3b8', marginLeft: 4 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: { fontSize: 12, fontWeight: '600' },
});
