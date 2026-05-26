'use client'

import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'
import { getAnalytics, type Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyBK8gG88TkYKYqzRsxYEGmo0aBLp7bD7ts",
  authDomain: "savz-s-mart.firebaseapp.com",
  projectId: "savz-s-mart",
  storageBucket: "savz-s-mart.firebasestorage.app",
  messagingSenderId: "347632108737",
  appId: "1:347632108737:web:09cdfba6827a9d3848c040",
  measurementId: "G-B1L83JP7CH",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

let messaging: Messaging | null = null
let analytics: Analytics | null = null

if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app)
    analytics = getAnalytics(app)
  } catch {
    // Messaging not supported in this environment
  }
}

export { app, messaging, analytics }

export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    const token = await getToken(messaging, { vapidKey })
    return token
  } catch {
    return null
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}
