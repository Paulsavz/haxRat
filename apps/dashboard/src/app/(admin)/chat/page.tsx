'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MessageSquare,
  Users,
  Search,
  X,
} from 'lucide-react'
import { useAdminStore } from '@/store/adminStore'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Dynamically import Stream components (client-side only)
const StreamChatComponent = dynamic(() => import('@/components/communication/StreamChatUI'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading chat...</p>
      </div>
    </div>
  ),
})

export default function ChatPage() {
  const { streamChatClient } = useAdminStore()

  if (!streamChatClient) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-sm mx-auto p-8">
          <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Chat not connected</h2>
          <p className="text-sm text-gray-500">
            The chat client is still initializing. Please ensure your Stream API key and token are
            configured correctly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden">
      <StreamChatComponent />
    </div>
  )
}
