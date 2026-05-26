'use client'

import { useState, useCallback } from 'react'
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useChannelStateContext,
  ChannelPreviewUIComponentProps,
} from 'stream-chat-react'
import {
  StreamCall,
  SpeakerLayout,
  CallControls,
  CallingState,
  useCallStateHooks,
  StreamVideo,
} from '@stream-io/video-react-sdk'
import { Phone, Video, PhoneOff, MessageSquare, Users, ChevronLeft } from 'lucide-react'
import { Channel as StreamChannel } from 'stream-chat'
import { useAdminStore } from '@/store/adminStore'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────
//  Custom channel preview item
// ─────────────────────────────────────────────
function CustomChannelPreview(props: ChannelPreviewUIComponentProps) {
  const { channel, setActiveChannel, active, unread } = props
  const lastMessage = channel.state?.messages?.[channel.state.messages.length - 1]
  const members = Object.values(channel.state?.members ?? {})
  const adminId = useAdminStore.getState().admin?.id
  const otherMember = members.find((m: any) => m.user_id !== adminId)
  const name = (otherMember as any)?.user?.name || channel.data?.name || 'Unknown'
  const avatar = (otherMember as any)?.user?.image

  return (
    <button
      onClick={() => setActiveChannel?.(channel)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        'hover:bg-sidebar-hover border-b border-sidebar-border',
        active && 'bg-sidebar-active'
      )}
    >
      <Avatar name={name} src={avatar} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={cn('text-sm truncate', active ? 'text-white font-semibold' : 'text-slate-300 font-medium')}>
            {name}
          </p>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {lastMessage?.created_at && (
              <span className="text-[10px] text-slate-500">
                {new Date(lastMessage.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
            {unread ? (
              <span className="inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 bg-brand-500 text-white text-[10px] font-bold rounded-full">
                {unread > 99 ? '99+' : unread}
              </span>
            ) : null}
          </div>
        </div>
        <p className="text-xs text-slate-500 truncate">
          {lastMessage?.text || 'No messages yet'}
        </p>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────
//  Custom channel header with call buttons
// ─────────────────────────────────────────────
interface CustomHeaderProps {
  onStartCall: (type: 'audio' | 'video') => void
  inCall: boolean
}

function CustomChannelHeader({ onStartCall, inCall }: CustomHeaderProps) {
  const { channel } = useChannelStateContext()
  const adminId = useAdminStore.getState().admin?.id
  const members = Object.values(channel.state?.members ?? {})
  const otherMember = members.find((m: any) => m.user_id !== adminId)
  const name = (otherMember as any)?.user?.name || channel.data?.name || 'Customer'
  const avatar = (otherMember as any)?.user?.image
  const isOnline = (otherMember as any)?.user?.online ?? false

  return (
    <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar name={name} src={avatar} size="md" online={isOnline} />
        <div>
          <p className="font-semibold text-gray-900 text-sm">{name}</p>
          <p className="text-xs text-gray-400">{isOnline ? 'Online' : 'Offline'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!inCall && (
          <>
            <button
              onClick={() => onStartCall('audio')}
              title="Audio call"
              className="p-2 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => onStartCall('video')}
              title="Video call"
              className="p-2 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <Video className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  In-call overlay component
// ─────────────────────────────────────────────
function CallOverlay({ onHangUp }: { onHangUp: () => void }) {
  const { useCallCallingState, useParticipants } = useCallStateHooks()
  const callingState = useCallCallingState()

  if (callingState === CallingState.LEFT) {
    onHangUp()
    return null
  }

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="absolute inset-0 z-20 bg-gray-900/95 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white text-sm">
            {callingState === CallingState.RINGING ? 'Calling...' : 'Connecting...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-20 bg-gray-900 flex flex-col overflow-hidden rounded-r-none">
      <SpeakerLayout />
      <div className="absolute bottom-0 left-0 right-0 pb-4 flex justify-center">
        <CallControls onLeave={onHangUp} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Main StreamChatUI
// ─────────────────────────────────────────────
export default function StreamChatUI() {
  const { streamChatClient, streamVideoClient, admin, activeCall, setActiveCall } = useAdminStore()
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null)
  const [inCallChannel, setInCallChannel] = useState<StreamChannel | null>(null)

  const handleStartCall = useCallback(
    async (type: 'audio' | 'video') => {
      if (!streamVideoClient || !admin || !activeChannel) {
        toast.error('Cannot start call')
        return
      }

      const members = Object.values(activeChannel.state?.members ?? {})
      const otherMember = members.find((m: any) => m.user_id !== admin.id)
      if (!otherMember) {
        toast.error('No other member in this channel')
        return
      }

      const customerId = (otherMember as any).user_id
      const callId = `${type}_${customerId}_${Date.now()}`

      try {
        const call = streamVideoClient.call(type === 'video' ? 'default' : 'audio_room', callId)
        await call.getOrCreate({
          ring: true,
          data: {
            members: [{ user_id: admin.id }, { user_id: customerId }],
          },
        })
        setActiveCall({ call, callType: type, channelId: activeChannel.id })
        setInCallChannel(activeChannel)
        toast.success(`${type === 'video' ? 'Video' : 'Audio'} call started`)
      } catch (err) {
        toast.error('Failed to start call')
        console.error(err)
      }
    },
    [streamVideoClient, admin, activeChannel, setActiveCall]
  )

  const handleHangUp = useCallback(async () => {
    if (activeCall?.call) {
      try {
        await activeCall.call.leave()
        await activeCall.call.endCall()
      } catch {}
    }
    setActiveCall(null)
    setInCallChannel(null)
  }, [activeCall, setActiveCall])

  if (!streamChatClient) return null

  const filters = {
    type: 'messaging',
    members: { $in: [admin!.id] },
  }

  const sort = { last_message_at: -1 as const }

  return (
    <Chat client={streamChatClient} theme="str-chat__theme-light">
      <div className="flex h-full w-full overflow-hidden">
        {/* Left: channel list */}
        <div className="w-72 flex-shrink-0 bg-sidebar-bg flex flex-col border-r border-sidebar-border">
          {/* Header */}
          <div className="px-4 py-4 border-b border-sidebar-border">
            <h2 className="text-sm font-semibold text-white">Chat Inbox</h2>
            <p className="text-xs text-sidebar-text mt-0.5">Customer conversations</p>
          </div>

          {/* Channel list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <ChannelList
              filters={filters}
              sort={sort}
              Preview={(props) => (
                <CustomChannelPreview
                  {...props}
                  setActiveChannel={(channel) => {
                    setActiveChannel(channel ?? null)
                    props.setActiveChannel?.(channel)
                  }}
                />
              )}
              EmptyStateIndicator={() => (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <MessageSquare className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="text-sm text-slate-400">No conversations yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Customer chats will appear here
                  </p>
                </div>
              )}
              LoadingIndicator={() => (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            />
          </div>

          {/* Admin info at bottom */}
          {admin && (
            <div className="px-4 py-3 border-t border-sidebar-border flex items-center gap-2">
              <Avatar name={admin.name} size="xs" online={true} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">{admin.name}</p>
                <p className="text-[10px] text-slate-500">Support Agent</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: active channel / empty state */}
        <div className="flex-1 overflow-hidden relative">
          {activeChannel ? (
            <Channel channel={activeChannel}>
              <Window>
                {/* Custom header */}
                <CustomChannelHeader
                  onStartCall={handleStartCall}
                  inCall={!!activeCall}
                />

                {/* Message list */}
                <div className="flex-1 overflow-hidden relative">
                  <MessageList />

                  {/* Call overlay */}
                  {activeCall?.call && streamVideoClient && (
                    <StreamVideo client={streamVideoClient}>
                      <StreamCall call={activeCall.call}>
                        <CallOverlay onHangUp={handleHangUp} />
                      </StreamCall>
                    </StreamVideo>
                  )}
                </div>

                {/* Message input */}
                <MessageInput />
              </Window>
              <Thread />
            </Channel>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="h-16 w-16 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  Select a conversation
                </h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  Choose a customer conversation from the left panel to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Chat>
  )
}
