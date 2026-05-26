import { StreamChat } from 'stream-chat'
import { StreamVideoClient } from '@stream-io/video-react-native-sdk'

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY!

// ─── Stream Chat ──────────────────────────────────────────────────────────────

let chatClientInstance: StreamChat | null = null

export function getStreamChatClient(): StreamChat {
  if (!chatClientInstance) {
    chatClientInstance = StreamChat.getInstance(STREAM_API_KEY)
  }
  return chatClientInstance
}

export async function connectChatUser(
  userId: string,
  userName: string,
  userImage: string | undefined,
  token: string
): Promise<StreamChat> {
  const client = getStreamChatClient()

  // Skip if already connected as the same user
  if (client.userID === userId) return client

  await client.connectUser(
    {
      id: userId,
      name: userName,
      image: userImage,
      role: 'admin',
    },
    token
  )

  return client
}

export async function disconnectChatUser(): Promise<void> {
  if (chatClientInstance && chatClientInstance.userID) {
    await chatClientInstance.disconnectUser()
  }
  chatClientInstance = null
}

// ─── Stream Video ─────────────────────────────────────────────────────────────

let videoClientInstance: StreamVideoClient | null = null

export function getStreamVideoClient(): StreamVideoClient | null {
  return videoClientInstance
}

export function createStreamVideoClient(
  userId: string,
  userName: string,
  userImage: string | undefined,
  token: string
): StreamVideoClient {
  if (videoClientInstance) return videoClientInstance

  videoClientInstance = new StreamVideoClient({
    apiKey: STREAM_API_KEY,
    user: {
      id: userId,
      name: userName,
      image: userImage,
      type: 'authenticated',
    },
    token,
  })

  return videoClientInstance
}

export async function disconnectVideoClient(): Promise<void> {
  if (videoClientInstance) {
    await videoClientInstance.disconnectUser()
    videoClientInstance = null
  }
}
