'use client'

import { useEffect } from 'react'
import {
  StreamCall,
  PaginatedGridLayout,
  CallControls,
  CallingState,
  useCallStateHooks,
  StreamVideo,
} from '@stream-io/video-react-sdk'
import type { Call } from '@stream-io/video-react-sdk'
import { useAdminStore } from '@/store/adminStore'

interface CallContentProps {
  onLeave: () => void
}

function CallContent({ onLeave }: CallContentProps) {
  const { useCallCallingState } = useCallStateHooks()
  const callingState = useCallCallingState()

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onLeave()
    }
  }, [callingState, onLeave])

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white text-sm">
            {callingState === CallingState.RINGING
              ? 'Ringing...'
              : callingState === CallingState.JOINING
              ? 'Joining call...'
              : 'Connecting...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" style={{ height: '480px' }}>
      <PaginatedGridLayout />
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <CallControls onLeave={onLeave} />
      </div>
    </div>
  )
}

interface ActiveCallViewProps {
  call: Call
  onLeave: () => void
}

export default function ActiveCallView({ call, onLeave }: ActiveCallViewProps) {
  const { streamVideoClient } = useAdminStore()

  if (!streamVideoClient) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-white/60 text-sm">Video client not initialized</p>
      </div>
    )
  }

  return (
    <StreamVideo client={streamVideoClient}>
      <StreamCall call={call}>
        <CallContent onLeave={onLeave} />
      </StreamCall>
    </StreamVideo>
  )
}
