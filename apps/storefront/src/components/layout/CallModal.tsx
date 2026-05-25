'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Loader2,
} from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { callsApi } from '../../lib/api';
import { Button } from '../ui/Button';

// ─── Component ────────────────────────────────────────────────────────────────

export function CallModal() {
  const { callId, callStatus, callType, callRoomUrl, callRoomToken, setCall } = useChatStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const callFrameRef = useRef<any>(null);

  const isVisible = callStatus === 'requesting' || callStatus === 'active';

  // Load Daily.co when call becomes active
  useEffect(() => {
    if (callStatus !== 'active' || !callRoomUrl) return;

    let mounted = true;

    const loadCall = async () => {
      try {
        const DailyIframe = (await import('@daily-co/daily-js')).default;
        if (!mounted || !frameRef.current) return;

        const frame = DailyIframe.wrap(frameRef.current, {
          url: callRoomUrl,
          token: callRoomToken ?? undefined,
          showLeaveButton: false,
          showFullscreenButton: true,
        });

        callFrameRef.current = frame;
        await frame.join();
      } catch (err) {
        console.error('Daily.co error:', err);
      }
    };

    loadCall();

    return () => {
      mounted = false;
      callFrameRef.current?.leave().catch(console.error);
      callFrameRef.current?.destroy().catch(console.error);
      callFrameRef.current = null;
    };
  }, [callStatus, callRoomUrl, callRoomToken]);

  const handleHangUp = async () => {
    try {
      if (callFrameRef.current) {
        await callFrameRef.current.leave();
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
      if (callId) await callsApi.end(callId);
    } catch (err) {
      console.error(err);
    } finally {
      setCall(null);
    }
  };

  const handleCancel = async () => {
    try {
      if (callId) await callsApi.end(callId);
    } catch {
      // ignore
    }
    setCall(null);
  };

  const toggleMute = () => {
    callFrameRef.current?.setLocalAudio(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    callFrameRef.current?.setLocalVideo(!isCameraOff);
    setIsCameraOff(!isCameraOff);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-float overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {callType === 'video' ? <Video size={20} /> : <Mic size={20} />}
            </div>
            <div>
              <p className="font-semibold">
                {callStatus === 'requesting'
                  ? 'Calling Support…'
                  : `${callType === 'video' ? 'Video' : 'Audio'} Call`}
              </p>
              <p className="text-xs text-primary-200">
                {callStatus === 'requesting' ? 'Waiting for staff to accept' : 'Connected'}
              </p>
            </div>

            {callStatus === 'active' && (
              <div className="ml-auto flex items-center gap-1.5 text-xs text-primary-200">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Live
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {callStatus === 'requesting' ? (
            <div className="flex flex-col items-center gap-6 py-8">
              {/* Pulsing animation */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary-200 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                      {callType === 'video' ? (
                        <Video size={20} className="text-white" />
                      ) : (
                        <Mic size={20} className="text-white" />
                      )}
                    </div>
                  </div>
                </div>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-primary-300 animate-ping"
                    style={{ animationDelay: `${i * 0.4}s`, animationDuration: '1.5s' }}
                  />
                ))}
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold text-ink">Connecting you to support…</p>
                <p className="text-sm text-ink-muted mt-1">
                  Please wait while a staff member accepts your call
                </p>
              </div>

              <Loader2 size={24} className="animate-spin text-primary-500" />

              <Button variant="danger" onClick={handleCancel} leftIcon={<PhoneOff size={16} />}>
                Cancel Call
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Video frame */}
              {callType === 'video' && (
                <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden">
                  <iframe
                    ref={frameRef}
                    allow="camera; microphone; fullscreen; display-capture"
                    className="w-full h-full border-0"
                    title="Video Call"
                  />
                </div>
              )}

              {/* Audio only visual */}
              {callType === 'audio' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <Mic size={32} className="text-primary-600" />
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary-500 rounded-full animate-pulse"
                        style={{
                          height: `${12 + Math.random() * 20}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-ink-muted">Audio call in progress</p>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-ink hover:bg-gray-200'
                  }`}
                >
                  {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {callType === 'video' && (
                  <button
                    onClick={toggleCamera}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isCameraOff ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-ink hover:bg-gray-200'
                    }`}
                  >
                    {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
                  </button>
                )}

                <button
                  onClick={handleHangUp}
                  className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg"
                >
                  <PhoneOff size={22} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
