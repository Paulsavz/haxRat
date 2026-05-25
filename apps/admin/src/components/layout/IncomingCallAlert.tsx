import { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { useAdminStore, CallRequest } from '@/store/adminStore';
import { callsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

function CallAlert({ call, onAccept, onDecline }: {
  call: CallRequest;
  onAccept: (call: CallRequest) => void;
  onDecline: (callId: string) => void;
}) {
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          onDecline(call.id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [call.id, onDecline]);

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-80 overflow-hidden animate-slide-in-right">
      {/* Top accent */}
      <div className={`h-1 ${call.callType === 'video' ? 'bg-brand-500' : 'bg-green-500'}`} />

      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2.5 rounded-full ${call.callType === 'video' ? 'bg-brand-50' : 'bg-green-50'}`}>
            {call.callType === 'video' ? (
              <Video size={20} className="text-brand-500" />
            ) : (
              <Phone size={20} className="text-green-500" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
              Incoming {call.callType} call
            </p>
            <p className="font-semibold text-slate-900 text-base">{call.customerName}</p>
            <p className="text-xs text-slate-400 mt-0.5">Auto-dismiss in {seconds}s</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
            <User size={16} className="text-slate-500" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-1000"
            style={{ width: `${(seconds / 30) * 100}%` }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onDecline(call.id)}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium text-sm transition-colors"
          >
            <PhoneOff size={16} />
            Decline
          </button>
          <button
            onClick={() => onAccept(call)}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-green-500 text-white hover:bg-green-600 font-medium text-sm transition-colors"
          >
            <Phone size={16} />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IncomingCallAlert() {
  const { pendingCallRequests, removeCallRequest, addActiveCall, socket } = useAdminStore();

  const handleAccept = async (call: CallRequest) => {
    try {
      const res = await callsAPI.acceptCall(call.id);
      removeCallRequest(call.id);
      addActiveCall({
        id: call.id,
        customerId: call.customerId,
        customerName: call.customerName,
        callType: call.callType,
        roomUrl: res.data.roomUrl || call.roomUrl || '',
        startedAt: new Date().toISOString(),
      });
      socket?.emit('call:accept', { callId: call.id });
      // Open call in a new window/tab
      if (res.data.roomUrl || call.roomUrl) {
        window.open(res.data.roomUrl || call.roomUrl, '_blank', 'width=800,height=600');
      }
      toast.success(`Accepted ${call.callType} call with ${call.customerName}`);
    } catch {
      toast.error('Failed to accept call');
    }
  };

  const handleDecline = async (callId: string) => {
    try {
      await callsAPI.declineCall(callId);
      socket?.emit('call:decline', { callId });
    } catch {
      // ignore
    } finally {
      removeCallRequest(callId);
    }
  };

  if (pendingCallRequests.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
      {pendingCallRequests.map((call) => (
        <CallAlert
          key={call.id}
          call={call}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      ))}
    </div>
  );
}
