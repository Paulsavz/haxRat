import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center">
        <div className="text-8xl font-extrabold text-surface-200">404</div>
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Page not found</h1>
          <p className="mt-2 text-ink-500">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/products" className="btn-secondary">
            Browse Products
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
