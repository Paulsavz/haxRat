'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { useAdminStore } from '@/store/adminStore'

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const setAdmin = useAdminStore((s) => s.setAdmin)

  useEffect(() => {
    const supabase = getSupabaseClient()

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session && pathname !== '/login') {
        router.replace('/login')
        return
      }

      if (session && pathname === '/login') {
        router.replace('/')
        return
      }

      if (session) {
        setAdmin({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Admin',
          avatar_url: session.user.user_metadata?.avatar_url,
          role: 'admin',
        })
      }

      setChecking(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && pathname !== '/login') {
        router.replace('/login')
      }
      if (event === 'SIGNED_IN' && pathname === '/login') {
        router.replace('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router, setAdmin])

  // Show nothing while checking auth on protected pages
  if (checking && pathname !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-content-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center animate-pulse">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth={2}
                d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-400 font-medium">Loading RetailHub Admin...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
