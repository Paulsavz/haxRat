import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import StreamAdminProvider from '@/components/communication/StreamAdminProvider'
import IncomingCallBanner from '@/components/communication/IncomingCallBanner'
import AdminAuthGuard from '@/components/communication/AdminAuthGuard'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'RetailHub Admin',
    template: '%s | RetailHub Admin',
  },
  description: 'RetailHub retail platform admin dashboard',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-content-bg antialiased">
        <AdminAuthGuard>
          <StreamAdminProvider>
            {/* Global incoming call banner — sits above everything */}
            <IncomingCallBanner />
            {children}
          </StreamAdminProvider>
        </AdminAuthGuard>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '14px',
              borderRadius: '10px',
              padding: '12px 16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  )
}
