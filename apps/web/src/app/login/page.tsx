'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Phone, Mail, ArrowRight, Store, Loader2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type LoginMode = 'phone' | 'email'
type PhoneStep = 'input' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>('phone')
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  // ─── Phone OTP ──────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Normalize phone to international format
      let normalized = phone.replace(/\s+/g, '')
      if (normalized.startsWith('0')) {
        normalized = '+233' + normalized.slice(1)
      }
      const { error } = await supabase.auth.signInWithOtp({ phone: normalized })
      if (error) throw error
      setPhoneStep('otp')
      toast.success('OTP sent to your phone!')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let normalized = phone.replace(/\s+/g, '')
      if (normalized.startsWith('0')) {
        normalized = '+233' + normalized.slice(1)
      }
      const { error } = await supabase.auth.verifyOtp({
        phone: normalized,
        token: otp,
        type: 'sms',
      })
      if (error) throw error
      toast.success('Signed in successfully!')
      router.push('/')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Google OAuth ────────────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Google sign in failed')
      setLoading(false)
    }
  }

  // ─── Magic link (email) ──────────────────────────────────
  const handleEmailMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      })
      if (error) throw error
      toast.success('Magic link sent! Check your inbox.')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-surface-50 to-primary-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 shadow-lg">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-ink-900">
              Retail<span className="text-primary-600">Hub</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-ink-900">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-500">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="card p-7">
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="btn-secondary w-full py-2.5 mb-6"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs text-ink-400">or continue with</span>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="mb-5 flex rounded-xl border border-surface-200 overflow-hidden">
            <button
              onClick={() => { setMode('phone'); setPhoneStep('input') }}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                mode === 'phone'
                  ? 'bg-primary-600 text-white'
                  : 'text-ink-500 hover:text-ink-700'
              )}
            >
              <Phone className="h-3.5 w-3.5" />
              Phone OTP
            </button>
            <button
              onClick={() => setMode('email')}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                mode === 'email'
                  ? 'bg-primary-600 text-white'
                  : 'text-ink-500 hover:text-ink-700'
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              Email Link
            </button>
          </div>

          {/* Phone OTP */}
          {mode === 'phone' && phoneStep === 'input' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0244 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-base"
                />
                <p className="mt-1 text-xs text-ink-400">Ghana number (0XX XXX XXXX)</p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Sending…' : 'Send OTP'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}

          {mode === 'phone' && phoneStep === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  Enter OTP
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="input-base text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
                <p className="mt-1 text-xs text-ink-400">
                  Code sent to {phone}
                </p>
              </div>
              <button type="submit" disabled={loading || otp.length < 4} className="btn-primary w-full py-2.5">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={() => { setPhoneStep('input'); setOtp('') }}
                className="btn-ghost w-full text-sm"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Resend OTP
              </button>
            </form>
          )}

          {/* Email magic link */}
          {mode === 'email' && (
            <form onSubmit={handleEmailMagicLink} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Sending link…' : 'Send Magic Link'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          By signing in, you agree to our{' '}
          <a href="#" className="underline hover:text-primary-600">Terms</a> and{' '}
          <a href="#" className="underline hover:text-primary-600">Privacy Policy</a>.
        </p>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-ink-500 hover:text-primary-600">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
