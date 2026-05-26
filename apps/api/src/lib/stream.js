import { StreamClient } from '@stream-io/node-sdk'
import { StreamChat } from 'stream-chat'

const apiKey = process.env.STREAM_API_KEY
const apiSecret = process.env.STREAM_API_SECRET

// Chat client (server-side)
export const streamChat = StreamChat.getInstance(apiKey, apiSecret)

// Video client (server-side)
export const streamVideo = new StreamClient(apiKey, apiSecret)

// Generate a chat token for a user
export function generateChatToken(userId) {
  return streamChat.createToken(userId)
}

// Generate a video call token for a user
export function generateVideoToken(userId) {
  return streamVideo.generateUserToken({ user_id: userId })
}

// Create or update a Stream user (must be called when user registers/logs in)
export async function upsertStreamUser(user) {
  await streamChat.upsertUser({
    id: user.id,
    name: user.name || user.email || 'User',
    email: user.email,
    role: user.role === 'admin' || user.role === 'support' ? 'admin' : 'user',
    image: user.avatar_url,
  })
}

// Create a Stream video call room
export async function createCallRoom(callId, type = 'default') {
  const call = streamVideo.video.call(type, callId)
  await call.getOrCreate({
    data: {
      created_by_id: 'system',
      custom: { callId },
    },
  })
  return call
}
