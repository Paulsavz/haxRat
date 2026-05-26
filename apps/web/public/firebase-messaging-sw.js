importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyBK8gG88TkYKYqzRsxYEGmo0aBLp7bD7ts",
  authDomain: "savz-s-mart.firebaseapp.com",
  projectId: "savz-s-mart",
  storageBucket: "savz-s-mart.firebasestorage.app",
  messagingSenderId: "347632108737",
  appId: "1:347632108737:web:09cdfba6827a9d3848c040",
})

const messaging = firebase.messaging()

// Background message handler
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {}
  self.registration.showNotification(title ?? 'RetailHub', {
    body: body ?? '',
    icon: icon ?? '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data,
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(clients.openWindow(url))
})
