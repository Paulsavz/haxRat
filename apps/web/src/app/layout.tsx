import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import StreamProvider from '@/components/communication/StreamProvider'
import ChatCallWidget from '@/components/communication/ChatCallWidget'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'RetailHub – Shop the Best',
    template: '%s | RetailHub',
  },
  description:
    'RetailHub is your one-stop destination for quality products. Shop thousands of items with fast delivery and live customer support.',
  keywords: ['retail', 'shopping', 'ecommerce', 'Ghana', 'RetailHub'],
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    siteName: 'RetailHub',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface-50 font-sans antialiased">
        {/* Stream provider initializes chat + video clients client-side */}
        <StreamProvider>
          {children}

          {/* Floating chat / call widget – always rendered at root */}
          <ChatCallWidget />
        </StreamProvider>

        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#16a34a', secondary: '#f8fafc' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#f8fafc' },
            },
          }}
        />
      </body>
    </html>
  )
}
