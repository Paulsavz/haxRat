export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'My Orders' }

// Redirect to profile page which has the orders tab
export default function OrdersPage() {
  redirect('/profile')
}
