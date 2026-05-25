import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ChatWidget } from '../components/layout/ChatWidget';
import { CallModal } from '../components/layout/CallModal';
import './globals.css';

// ─── Font ─────────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: 'RetailHub — Shop Quality Products Online',
    template: '%s | RetailHub',
  },
  description:
    'Discover thousands of quality products delivered fast to your door. Shop electronics, fashion, groceries and more at RetailHub.',
  keywords: ['shopping', 'online store', 'Ghana', 'retail', 'delivery'],
  authors: [{ name: 'RetailHub' }],
  creator: 'RetailHub',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://retailhub.com'),
  openGraph: {
    type: 'website',
    siteName: 'RetailHub',
    title: 'RetailHub — Shop Quality Products Online',
    description: 'Discover thousands of quality products delivered fast to your door.',
  },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RetailHub',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="font-sans bg-surface-subtle text-ink antialiased">
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
            },
          }}
        />

        {/* Global header */}
        <Header />

        {/* Page content */}
        <main className="pt-16 min-h-[calc(100vh-64px)]">{children}</main>

        {/* Footer */}
        <Footer />

        {/* Chat widget (floats above everything) */}
        <ChatWidget />

        {/* Call modal */}
        <CallModal />
      </body>
    </html>
  );
}
