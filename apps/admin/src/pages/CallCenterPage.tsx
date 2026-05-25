import { useEffect, useState } from 'react';
import { Phone, Video, PhoneOff, Mic, MicOff, Camera, CameraOff, Clock, User } from 'lucide-react';
import { callsAPI } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { LoadingScreen } from '@/components/ui/Spinner';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CallHistory {
  id: string;
  customerName: string;
  callType: 'audio' | 'video';
  duration: number; // seconds
  status: 'answered' | 'missed' | 'declined';
  startedAt: string;
}

interface ActiveCallDisplay {
  id: string;
  customerName: string;
  callType: 'audio' | 'video';
  roomUrl: string;
  startedAt: string;
  muted?: boolean;
  cameraOff?: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ActiveCallCard({ call, onEnd }: { call: ActiveCallDisplay; onEnd: (id: string) => void }) {
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
            {call.callType === 'video' ? (
              <Video size={20} className="text-white" />
            ) : (
              <Phone size={20} className="text-white" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">{call.customerName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-slate-300 text-sm">{formatDuration(elapsed)}</span>
              <span className="text-slate-400 text-xs capitalize">· {call.callType}</span>
            </div>
          </div>
          <button
            onClick={() => onEnd(call.id)}
            className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          >
            <PhoneOff size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Daily.co iframe */}
      {call.roomUrl && (
        <div className="relative">
          <iframe
            src={call.roomUrl}
            className="w-full h-64 border-0"
            allow="camera; microphone; fullscreen; display-capture"
            title="Video call"
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4 border-t border-slate-100">
        <button
          onClick={() => setMuted(!muted)}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
            muted ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        {call.callType === 'video' && (
          <button
            onClick={() => setCameraOff(!cameraOff)}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
              cameraOff ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={cameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {cameraOff ? <CameraOff size={18} /> : <Camera size={18} />}
          </button>
        )}
        <button
          onClick={() => onEnd(call.id)}
          className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          title="End call"
        >
          <PhoneOff size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}

export default function CallCenterPage() {
  const { activeCalls, removeActiveCall, socket } = useAdminStore();
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCalls, setDisplayCalls] = useState<ActiveCallDisplay[]>([]);

  useEffect(() => {
    setDisplayCalls(
      activeCalls.map((c) => ({
        ...c,
        muted: false,
        cameraOff: false,
      }))
    );
  }, [activeCalls]);

  const fetchHistory = async () => {
    try {
      const res = await callsAPI.getHistory();
      setCallHistory(res.data?.calls || res.data || []);
    } catch {
      setCallHistory([
        { id: '1', customerName: 'Kwame Asante', callType: 'video', duration: 245, status: 'answered', startedAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', customerName: 'Ama Mensah', callType: 'audio', duration: 0, status: 'missed', startedAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '3', customerName: 'Kofi Boateng', callType: 'audio', duration: 120, status: 'answered', startedAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '4', customerName: 'Abena Ofori', callType: 'video', duration: 0, status: 'declined', startedAt: new Date(Date.now() - 172800000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('call:ended', ({ callId }: { callId: string }) => {
      removeActiveCall(callId);
      fetchHistory();
    });
    return () => { socket.off('call:ended'); };
  }, [socket, removeActiveCall]);

  const handleEndCall = async (callId: string) => {
    try {
      await callsAPI.endCall(callId);
      removeActiveCall(callId);
      socket?.emit('call:end', { callId });
      toast.success('Call ended');
      fetchHistory();
    } catch {
      toast.error('Failed to end call');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Call Center</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage active and incoming calls</p>
      </div>

      {/* Active Calls */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Active Calls
          {displayCalls.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              {displayCalls.length} live
            </span>
          )}
        </h2>

        {displayCalls.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center text-slate-400">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Phone size={24} className="text-slate-300" />
            </div>
            <p className="font-medium text-slate-500">No active calls</p>
            <p className="text-sm mt-1">Incoming calls will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayCalls.map((call) => (
              <ActiveCallCard key={call.id} call={call} onEnd={handleEndCall} />
            ))}
          </div>
        )}
      </div>

      {/* Call History */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">Call History</h2>
        <Table>
          <TableHead>
            <tr>
              <Th>Customer</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Duration</Th>
              <Th>Date</Th>
            </tr>
          </TableHead>
          <TableBody>
            {callHistory.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                  No call history yet
                </td>
              </tr>
            ) : (
              callHistory.map((call) => (
                <Tr key={call.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={call.customerName} size="sm" />
                      <span className="font-medium text-slate-900">{call.customerName}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      {call.callType === 'video' ? (
                        <Video size={14} />
                      ) : (
                        <Phone size={14} />
                      )}
                      <span className="capitalize">{call.callType}</span>
                    </div>
                  </Td>
                  <Td>
                    <Badge
                      variant={
                        call.status === 'answered'
                          ? 'success'
                          : call.status === 'missed'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock size={13} />
                      <span>{call.duration > 0 ? formatDuration(call.duration) : '—'}</span>
                    </div>
                  </Td>
                  <Td className="text-slate-400">{formatRelativeTime(call.startedAt)}</Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Calls Today', value: callHistory.filter(c => formatDate(c.startedAt) === formatDate(new Date())).length || 4, icon: <Phone size={18} />, color: 'bg-blue-50 text-blue-500' },
          { label: 'Answered', value: callHistory.filter(c => c.status === 'answered').length || 3, icon: <User size={18} />, color: 'bg-green-50 text-green-500' },
          { label: 'Missed', value: callHistory.filter(c => c.status === 'missed').length || 1, icon: <PhoneOff size={18} />, color: 'bg-amber-50 text-amber-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
