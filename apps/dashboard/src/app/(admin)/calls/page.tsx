'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  Phone,
  Video,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  Clock,
  Users,
} from 'lucide-react'
import { useAdminStore } from '@/store/adminStore'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatDateTime, formatDuration, formatRelativeTime } from '@/lib/utils'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

// Dynamic import of call view (client-side only)
const ActiveCallView = dynamic(() => import('@/components/communication/ActiveCallView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-900 rounded-2xl">
      <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

interface CallRecord {
  id: string
  customer_name: string
  customer_avatar?: string
  type: 'audio' | 'video'
  duration: number
  status: 'answered' | 'missed' | 'declined'
  created_at: string
}

const mockCallHistory: CallRecord[] = [
  { id: '1', customer_name: 'Kwame Asante', type: 'video', duration: 342, status: 'answered', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', customer_name: 'Ama Boateng', type: 'audio', duration: 0, status: 'missed', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: '3', customer_name: 'Kofi Mensah', type: 'audio', duration: 127, status: 'answered', created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: '4', customer_name: 'Abena Osei', type: 'video', duration: 0, status: 'declined', created_at: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: '5', customer_name: 'Yaw Darko', type: 'video', duration: 891, status: 'answered', created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: '6', customer_name: 'Efua Ansah', type: 'audio', duration: 235, status: 'answered', created_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString() },
]

const statusConfig = {
  answered: { icon: PhoneCall, color: 'text-green-500', label: 'Answered', variant: 'success' as const },
  missed: { icon: PhoneMissed, color: 'text-red-500', label: 'Missed', variant: 'danger' as const },
  declined: { icon: PhoneOff, color: 'text-gray-400', label: 'Declined', variant: 'gray' as const },
}

export default function CallsPage() {
  const { activeCall, setActiveCall } = useAdminStore()
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCallHistory()
  }, [])

  async function loadCallHistory() {
    setLoading(true)
    try {
      const res = await api.getCallHistory()
      setCallHistory(res.data)
    } catch {
      setCallHistory(mockCallHistory)
    } finally {
      setLoading(false)
    }
  }

  const handleEndCall = async () => {
    if (activeCall?.call) {
      try {
        await activeCall.call.leave()
        await activeCall.call.endCall()
      } catch {}
    }
    setActiveCall(null)
  }

  return (
    <div className="p-6 space-y-6 page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Call Center</h1>
        <p className="text-sm text-gray-500">Manage audio and video calls with customers</p>
      </div>

      {/* Active call view */}
      {activeCall ? (
        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-white">
                {activeCall.callType === 'video' ? 'Video' : 'Audio'} Call Active
              </span>
            </div>
          </div>
          <ActiveCallView call={activeCall.call} onLeave={handleEndCall} />
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-2xl p-10 text-center">
          <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Phone className="h-8 w-8 text-white/60" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Active Call</h3>
          <p className="text-sm text-white/40 max-w-xs mx-auto">
            Incoming customer calls will appear here automatically. You can also start calls from
            the Orders or Customers pages.
          </p>
        </div>
      )}

      {/* Call history */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Call History</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : callHistory.length === 0 ? (
            <div className="py-12 text-center">
              <PhoneOff className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No call history</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {callHistory.map((call) => {
                const config = statusConfig[call.status]
                const StatusIcon = config.icon

                return (
                  <div key={call.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <Avatar name={call.customer_name} src={call.customer_avatar} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{call.customer_name}</p>
                        <div className={cn('flex items-center gap-1', config.color)}>
                          {call.type === 'video' ? (
                            <Video className="w-3.5 h-3.5" />
                          ) : (
                            <Phone className="w-3.5 h-3.5" />
                          )}
                          <span className="text-xs font-medium capitalize">{call.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(call.created_at)}
                        </span>
                        {call.duration > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {formatDuration(call.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusIcon className={cn('w-4 h-4', config.color)} />
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
