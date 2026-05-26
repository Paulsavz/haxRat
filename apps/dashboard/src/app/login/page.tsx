'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Metadata } from 'next'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = getSupabaseClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.session) {
        router.replace('/')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sidebar-bg to-slate-800 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-sidebar-bg px-8 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white leading-none">RetailHub</p>
                <p className="text-xs text-slate-400 mt-0.5">Admin Console</p>
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-slate-400 mt-1">
              Sign in to manage your retail platform
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@retailhub.com"
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-gray-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    onClick={() => {
                      // TODO: implement forgot password
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              Protected area — authorized personnel only
            </p>
          </div>
        </div>

        {/* Version tag */}
        <p className="text-center text-xs text-slate-500 mt-4">
          RetailHub Admin v1.0
        </p>
      </div>
    </div>
  )
}
