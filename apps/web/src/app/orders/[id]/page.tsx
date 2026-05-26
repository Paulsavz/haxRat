export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import OrderDetailClient from './OrderDetailClient'

export const metadata: Metadata = { title: 'Order Confirmation' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <OrderDetailClient orderId={id} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
