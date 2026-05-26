'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Phone,
  Video,
  X,
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  PhoneOff,
  Loader2,
  User,
  PhoneCall,
} from 'lucide-react'
import { StreamChat } from 'stream-chat'
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  Window,
} from 'stream-chat-react'
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  PaginatedGridLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk'
import { useCommunicationStore, type ActiveTab } from '@/store/communicationStore'
import { useAuthStore } from '@/store/authStore'
import { authApi, callsApi } from '@/lib/api'
import { cn, generateGuestId } from '@/lib/utils'
import type { Channel as StreamChannelType } from 'stream-chat'
import type { Call } from '@stream-io/video-react-sdk'

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY || ''

// ─── Waiting animation ─────────────────────────────────────
function WaitingAnimation({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative flex items-center justify-center">
        <span className="absolute h-16 w-16 rounded-full bg-primary-100 animate-ping opacity-75" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary-600">
          <PhoneCall className="h-6 w-6 text-white" />
        </span>
      </div>
      <p className="text-sm font-medium text-ink-600">{message}</p>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-primary-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Audio call controls ─────────────────────────────────────
function AudioCallControls({ onHangUp }: { onHangUp: () => void }) {
  const { useMicrophoneState } = useCallStateHooks()
  const { microphone, isMute } = useMicrophoneState()

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <button
        onClick={() => microphone.toggle()}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full transition-all',
          isMute
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-surface-100 text-ink-600 hover:bg-surface-200'
        )}
        title={isMute ? 'Unmute' : 'Mute'}
      >
        {isMute ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>
      <button
        onClick={onHangUp}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-all hover:bg-red-700 active:scale-95"
        title="Hang up"
      >
        <PhoneOff className="h-6 w-6" />
      </button>
    </div>
  )
}

// ─── Video call controls ─────────────────────────────────────
function VideoCallControls({ onHangUp }: { onHangUp: () => void }) {
  const { useMicrophoneState, useCameraState } = useCallStateHooks()
  const { microphone, isMute: micMuted } = useMicrophoneState()
  const { camera, isMute: camOff } = useCameraState()

  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <button
        onClick={() => microphone.toggle()}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full transition-all',
          micMuted
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-surface-100 text-ink-600 hover:bg-surface-200'
        )}
      >
        {micMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>
      <button
        onClick={onHangUp}
        className="flex h-13 w-13 items-center justify-center rounded-full bg-red-600 p-3 text-white shadow-lg transition-all hover:bg-red-700 active:scale-95"
      >
        <PhoneOff className="h-5 w-5" />
      </button>
      <button
        onClick={() => camera.toggle()}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full transition-all',
          camOff
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-surface-100 text-ink-600 hover:bg-surface-200'
        )}
      >
        {camOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
      </button>
    </div>
  )
}

// ─── Guest form ───────────────────────────────────────────────
interface GuestFormProps {
  onSubmit: (name: string, phone: string) => Promise<void>
  loading: boolean
}

function GuestForm({ onSubmit, loading }: GuestFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && phone.trim()) {
      onSubmit(name.trim(), phone.trim())
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
        <User className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-ink-900">Start a Conversation</h3>
      <p className="mb-6 text-center text-sm text-ink-500">
        Enter your details to chat with our support team
      </p>
      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-base"
          required
        />
        <input
          type="tel"
          placeholder="Phone number (e.g. 0244000000)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input-base"
          required
        />
        <button
          type="submit"
          disabled={loading || !name.trim() || !phone.trim()}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting…
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4" />
              Start Chat
            </>
          )}
        </button>
      </form>
    </div>
  )
}

// ─── Tab button ───────────────────────────────────────────────
interface TabBtnProps {
  tab: ActiveTab
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function TabBtn({ active, onClick, icon, label }: TabBtnProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all',
        active
          ? 'border-b-2 border-primary-600 text-primary-600'
          : 'border-b-2 border-transparent text-ink-500 hover:text-ink-700'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── Chat Tab ─────────────────────────────────────────────────
interface ChatTabProps {
  chatClient: StreamChat
  channelId: string
}

function ChatTab({ chatClient, channelId }: ChatTabProps) {
  const [channel, setChannel] = useState<StreamChannelType | null>(null)

  useEffect(() => {
    const ch = chatClient.channel('messaging', channelId, {
      name: 'Support Chat',
      members: [chatClient.userID!],
    })

    ch.watch().then(() => setChannel(ch)).catch(console.error)

    return () => {
      ch.stopWatching().catch(console.error)
    }
  }, [chatClient, channelId])

  if (!channel) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <Chat client={chatClient} theme="str-chat__theme-light">
      <Channel channel={channel}>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput focus />
        </Window>
      </Channel>
    </Chat>
  )
}

// ─── Audio Call Tab ───────────────────────────────────────────
interface AudioCallTabProps {
  videoClient: StreamVideoClient
}

function AudioCallTab({ videoClient }: AudioCallTabProps) {
  const [call, setCall] = useState<Call | null>(null)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle')
  const [error, setError] = useState('')

  const startCall = useCallback(async () => {
    setStatus('connecting')
    setError('')
    try {
      const { callId } = await callsApi.create('audio_room')
      const c = videoClient.call('audio_room', callId)
      await c.join({ create: true })
      setCall(c)
      setStatus('active')
    } catch (err) {
      console.error(err)
      setError('Failed to start call. Please try again.')
      setStatus('idle')
    }
  }, [videoClient])

  const hangUp = useCallback(async () => {
    if (call) {
      await call.leave()
      setCall(null)
    }
    setStatus('ended')
  }, [call])

  if (status === 'ended') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
          <PhoneOff className="h-7 w-7 text-ink-400" />
        </div>
        <p className="text-sm font-medium text-ink-600">Call ended</p>
        <button onClick={() => setStatus('idle')} className="btn-secondary text-xs">
          Start new call
        </button>
      </div>
    )
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
          <Phone className="h-10 w-10 text-primary-600" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-ink-900">Audio Call Support</h3>
          <p className="mt-1 text-sm text-ink-500">
            Talk directly with our support team. No video required.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={startCall} className="btn-primary w-full max-w-xs">
          <Phone className="h-4 w-4" />
          Start Audio Call
        </button>
      </div>
    )
  }

  if (status === 'connecting') {
    return <WaitingAnimation message="Connecting to support…" />
  }

  if (status === 'active' && call) {
    return (
      <StreamVideo client={videoClient}>
        <StreamCall call={call}>
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600">
                <Mic className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-ink-900">Audio Call Active</p>
                <p className="text-xs text-ink-500 mt-1">Waiting for staff to join…</p>
              </div>
              <SpeakerLayout />
            </div>
            <div className="border-t border-surface-200">
              <AudioCallControls onHangUp={hangUp} />
            </div>
          </div>
        </StreamCall>
      </StreamVideo>
    )
  }

  return null
}

// ─── Video Call Tab ───────────────────────────────────────────
interface VideoCallTabProps {
  videoClient: StreamVideoClient
}

function VideoCallTab({ videoClient }: VideoCallTabProps) {
  const [call, setCall] = useState<Call | null>(null)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle')
  const [error, setError] = useState('')

  const startCall = useCallback(async () => {
    setStatus('connecting')
    setError('')
    try {
      const { callId } = await callsApi.create('default')
      const c = videoClient.call('default', callId)
      await c.join({ create: true })
      setCall(c)
      setStatus('active')
    } catch (err) {
      console.error(err)
      setError('Failed to start call. Please try again.')
      setStatus('idle')
    }
  }, [videoClient])

  const hangUp = useCallback(async () => {
    if (call) {
      await call.leave()
      setCall(null)
    }
    setStatus('ended')
  }, [call])

  if (status === 'ended') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
          <VideoOff className="h-7 w-7 text-ink-400" />
        </div>
        <p className="text-sm font-medium text-ink-600">Video call ended</p>
        <button onClick={() => setStatus('idle')} className="btn-secondary text-xs">
          Start new call
        </button>
      </div>
    )
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
          <Video className="h-10 w-10 text-primary-600" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-ink-900">Video Call Support</h3>
          <p className="mt-1 text-sm text-ink-500">
            Face-to-face support with our team. Camera and mic required.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={startCall} className="btn-primary w-full max-w-xs">
          <Video className="h-4 w-4" />
          Start Video Call
        </button>
      </div>
    )
  }

  if (status === 'connecting') {
    return <WaitingAnimation message="Setting up video call…" />
  }

  if (status === 'active' && call) {
    return (
      <StreamVideo client={videoClient}>
        <StreamCall call={call}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <PaginatedGridLayout />
            </div>
            <div className="border-t border-surface-200 bg-white">
              <VideoCallControls onHangUp={hangUp} />
            </div>
          </div>
        </StreamCall>
      </StreamVideo>
    )
  }

  return null
}

// ─── Main Widget ──────────────────────────────────────────────
export default function ChatCallWidget() {
  const {
    isWidgetOpen,
    activeTab,
    unreadCount,
    guestInfo,
    streamChatClient,
    streamVideoClient,
    setIsWidgetOpen,
    setActiveTab,
    setGuestInfo,
    setStreamChatClient,
    setStreamVideoClient,
    setChatToken,
    setVideoToken,
  } = useCommunicationStore()

  const { user } = useAuthStore()
  const [guestLoading, setGuestLoading] = useState(false)
  const [chatCssLoaded, setChatCssLoaded] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)

  // CSS loaded via globals.css @import — no dynamic import needed
  useEffect(() => {
    setChatCssLoaded(true)
  }, [])

  // Restore guest session from localStorage on mount
  useEffect(() => {
    if (!user && !guestInfo) {
      const stored = localStorage.getItem('retailhub_guest')
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as {
            id: string
            name: string
            phone: string
            chatToken: string
            videoToken: string
          }
          setGuestInfo(parsed)
          initGuestClients(parsed.id, parsed.name, parsed.chatToken, parsed.videoToken)
        } catch {
          localStorage.removeItem('retailhub_guest')
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function initGuestClients(
    id: string,
    name: string,
    chatToken: string,
    videoToken: string
  ) {
    if (!STREAM_API_KEY) return
    try {
      const chatClient = StreamChat.getInstance(STREAM_API_KEY)
      if (chatClient.userID !== id) {
        await chatClient.connectUser({ id, name }, chatToken)
      }
      setStreamChatClient(chatClient)
      setChatToken(chatToken)

      const videoClient = new StreamVideoClient({
        apiKey: STREAM_API_KEY,
        user: { id, name },
        token: videoToken,
      })
      setStreamVideoClient(videoClient)
      setVideoToken(videoToken)
    } catch (err) {
      console.error('[ChatCallWidget] Failed to init guest clients:', err)
    }
  }

  const handleGuestSubmit = async (name: string, phone: string) => {
    setGuestLoading(true)
    try {
      const res = await authApi.registerGuest({ name, phone })
      const guest = {
        id: res.guestId,
        name,
        phone,
        chatToken: res.chatToken,
        videoToken: res.videoToken,
      }
      setGuestInfo(guest)
      localStorage.setItem('retailhub_guest', JSON.stringify(guest))
      await initGuestClients(guest.id, guest.name, guest.chatToken, guest.videoToken)
    } catch (err) {
      console.error(err)
    } finally {
      setGuestLoading(false)
    }
  }

  // Determine chat channel ID
  const chatChannelId = user
    ? `support_${user.id}`
    : guestInfo
    ? `support_${guestInfo.id}`
    : null

  // Check if user/guest is ready to use Stream
  const isStreamReady = !!streamChatClient && !!chatChannelId
  const isVideoReady = !!streamVideoClient
  const needsGuestForm = !user && !guestInfo

  const tabs: { id: ActiveTab; icon: React.ReactNode; label: string }[] = [
    { id: 'chat', icon: <MessageCircle className="h-3.5 w-3.5" />, label: 'Chat' },
    { id: 'audio', icon: <Phone className="h-3.5 w-3.5" />, label: 'Audio Call' },
    { id: 'video', icon: <Video className="h-3.5 w-3.5" />, label: 'Video Call' },
  ]

  return (
    <>
      {/* ─── Floating Button ─────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {!isWidgetOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              onClick={() => setIsWidgetOpen(true)}
              className="animate-pulse-ring relative flex items-center gap-2.5 rounded-full bg-primary-600 px-5 py-3.5 text-sm font-semibold text-white shadow-float transition-all hover:bg-primary-700 active:scale-95"
              aria-label="Open support chat"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Talk to Us</span>
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Communication Panel ──────────────────────────── */}
      <AnimatePresence>
        {isWidgetOpen && (
          <motion.div
            ref={widgetRef}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className={cn(
              'fixed z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-widget border border-surface-200',
              // Desktop: bottom-right anchored
              'bottom-6 right-6',
              // Width + height
              'w-[calc(100vw-3rem)] sm:w-[380px]',
              'h-[560px]'
            )}
            style={{ maxHeight: 'calc(100vh - 5rem)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-200 bg-primary-600 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">RetailHub Support</p>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    <span className="text-[10px] text-white/80">Online · Usually replies in mins</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsWidgetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/20 hover:text-white"
                aria-label="Close widget"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-surface-200 bg-white">
              {tabs.map((t) => (
                <TabBtn
                  key={t.id}
                  tab={t.id}
                  active={activeTab === t.id}
                  onClick={() => setActiveTab(t.id)}
                  icon={t.icon}
                  label={t.label}
                />
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {/* Guest form shown when not logged in and no guest session */}
              {needsGuestForm ? (
                <GuestForm onSubmit={handleGuestSubmit} loading={guestLoading} />
              ) : (
                <>
                  {/* Chat Tab */}
                  {activeTab === 'chat' && (
                    <div className="h-full overflow-hidden">
                      {isStreamReady ? (
                        <ChatTab
                          chatClient={streamChatClient!}
                          channelId={chatChannelId!}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audio Call Tab */}
                  {activeTab === 'audio' && (
                    <div className="h-full overflow-hidden">
                      {isVideoReady ? (
                        <AudioCallTab videoClient={streamVideoClient!} />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video Call Tab */}
                  {activeTab === 'video' && (
                    <div className="h-full overflow-hidden">
                      {isVideoReady ? (
                        <VideoCallTab videoClient={streamVideoClient!} />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center border-t border-surface-200 py-2">
              <span className="text-[10px] text-ink-400">
                Powered by{' '}
                <span className="font-semibold text-primary-600">RetailHub</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
