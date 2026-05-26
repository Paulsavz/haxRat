'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Video, PhoneOff, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminStore } from '@/store/adminStore'
import Avatar from '@/components/ui/Avatar'

const RING_DURATION = 30 // seconds

export default function IncomingCallBanner() {
  const router = useRouter()
  const { incomingCall, setIncomingCall, setActiveCall } = useAdminStore()
  const [countdown, setCountdown] = useState(RING_DURATION)
  const [declining, setDeclining] = useState(false)

  // Reset countdown when a new call comes in
  useEffect(() => {
    if (!incomingCall) return
    setCountdown(RING_DURATION)
  }, [incomingCall])

  // Countdown timer
  useEffect(() => {
    if (!incomingCall) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-decline after timeout
          handleDecline()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [incomingCall])

  const handleAccept = useCallback(async () => {
    if (!incomingCall) return
    try {
      await incomingCall.call.accept()
      setActiveCall({
        call: incomingCall.call,
        callType: incomingCall.callType,
      })
      setIncomingCall(null)
      router.push('/calls')
    } catch (err) {
      console.error('Failed to accept call:', err)
    }
  }, [incomingCall, router, setActiveCall, setIncomingCall])

  const handleDecline = useCallback(async () => {
    if (!incomingCall || declining) return
    setDeclining(true)
    try {
      await incomingCall.call.reject()
    } catch (err) {
      console.error('Failed to decline call:', err)
    } finally {
      setIncomingCall(null)
      setDeclining(false)
    }
  }, [incomingCall, declining, setIncomingCall])

  const handleDismiss = useCallback(() => {
    setIncomingCall(null)
  }, [setIncomingCall])

  if (!incomingCall) return null

  const isVideo = incomingCall.callType === 'video'

  return (
    <div
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-[100]',
        'w-full max-w-sm mx-4'
      )}
    >
      <div
        className={cn(
          'relative bg-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden',
          'border border-white/10',
          'animate-fade-in'
        )}
        style={{
          animation: 'fade-in 0.3s ease-out, pulse-border 1.5s ease-in-out infinite',
        }}
      >
        {/* Pulsing ring effect */}
        <div className="absolute inset-0 rounded-2xl ring-2 ring-brand-500 animate-pulse-ring pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {isVideo ? (
              <Video className="w-3.5 h-3.5 text-brand-400" />
            ) : (
              <Phone className="w-3.5 h-3.5 text-green-400" />
            )}
            <span className="font-medium text-white">
              Incoming {isVideo ? 'Video' : 'Audio'} Call
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Countdown */}
            <div className="relative h-7 w-7">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 28 28">
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-700"
                />
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 11}`}
                  strokeDashoffset={`${2 * Math.PI * 11 * (1 - countdown / RING_DURATION)}`}
                  className="text-brand-400 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                {countdown}
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Caller info */}
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="relative">
            <Avatar
              name={incomingCall.callerName}
              src={incomingCall.callerAvatar}
              size="lg"
            />
            {/* Ring animation around avatar */}
            <span className="absolute inset-0 rounded-full ring-2 ring-brand-400 animate-ping opacity-40" />
          </div>
          <div>
            <p className="font-semibold text-white">{incomingCall.callerName}</p>
            <p className="text-xs text-gray-400">Wants to {isVideo ? 'video call' : 'call'} you</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 flex gap-3">
          <button
            onClick={handleDecline}
            disabled={declining}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm',
              'bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <PhoneOff className="w-4 h-4" />
            Decline
          </button>
          <button
            onClick={handleAccept}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm',
              isVideo
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'bg-green-600 text-white hover:bg-green-700',
              'transition-colors shadow-lg'
            )}
          >
            {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
