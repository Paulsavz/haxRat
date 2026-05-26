import 'react-native-url-polyfill/auto'
import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StreamVideo } from '@stream-io/video-react-native-sdk'
import { OverlayProvider } from 'stream-chat-expo'
import { useAdminStore } from '../store/adminStore'
import { connectChatUser, createStreamVideoClient } from '../lib/stream'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function RootLayout() {
  const {
    admin,
    streamToken,
    streamVideoClient,
    setStreamChatClient,
    setStreamVideoClient,
  } = useAdminStore()

  // Re-initialise Stream clients after a cold start (they are not persisted)
  useEffect(() => {
    async function initStream() {
      if (!admin || !streamToken) return

      try {
        const chatClient = await connectChatUser(
          admin.id,
          admin.name,
          admin.avatarUrl,
          streamToken
        )
        setStreamChatClient(chatClient)

        const videoClient = createStreamVideoClient(
          admin.id,
          admin.name,
          admin.avatarUrl,
          streamToken
        )
        setStreamVideoClient(videoClient)
      } catch (e) {
        console.warn('Stream init error:', e)
      }
    }

    initStream()
  }, [admin?.id, streamToken])

  const content = (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
      </Stack>
    </SafeAreaProvider>
  )

  // Wrap with StreamVideo provider only when client is ready
  if (streamVideoClient) {
    return (
      <StreamVideo client={streamVideoClient}>
        <OverlayProvider>
          {content}
        </OverlayProvider>
      </StreamVideo>
    )
  }

  return <OverlayProvider>{content}</OverlayProvider>
}
