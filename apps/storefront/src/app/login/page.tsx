'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, ArrowLeft, RefreshCw, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OTPInput({ length = 6, onChange }: { length?: number; onChange: (val: string) => void }) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = cleaned;
    setDigits(next);
    onChange(next.join(''));
    if (cleaned && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const next = Array(length).fill('');
    text.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    onChange(next.join(''));
    refs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200 transition-all bg-surface-subtle"
          style={{ borderColor: d ? '#2563eb' : undefined }}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { session, setSession } = useAuthStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  // Redirect if already logged in
  useEffect(() => {
    if (session) router.replace('/profile');
  }, [session, router]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendTimer]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\s+/g, '');
    if (!cleaned) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: cleaned });
      if (error) throw error;
      setStep('otp');
      setResendTimer(60);
      toast.success('OTP sent to your phone!');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;

    setLoading(true);
    try {
      const cleaned = phone.replace(/\s+/g, '');
      const { data, error } = await supabase.auth.verifyOtp({
        phone: cleaned,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      setSession(data.session);
      toast.success('Welcome back!');
      router.replace('/profile');
    } catch (err: any) {
      toast.error(err.message ?? 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/profile` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message ?? 'Google login failed');
      setGoogleLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    const cleaned = phone.replace(/\s+/g, '');
    const { error } = await supabase.auth.signInWithOtp({ phone: cleaned });
    if (!error) {
      setResendTimer(60);
      toast.success('OTP resent!');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-ink">
            {step === 'phone' ? 'Sign in' : 'Enter OTP'}
          </h1>
          <p className="text-ink-muted text-sm mt-2">
            {step === 'phone'
              ? 'Sign in with your phone number or Google'
              : `We sent a 6-digit code to ${phone}`}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-card p-7">
          {step === 'phone' ? (
            <div className="space-y-5">
              <form onSubmit={handleSendOTP} className="space-y-4">
                <Input
                  label="Phone Number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 20 000 0000"
                  required
                  fullWidth
                  leftIcon={<Phone size={16} />}
                  hint="Include country code (e.g. +233)"
                />
                <Button type="submit" fullWidth size="lg" loading={loading}>
                  Continue with Phone
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-ink-faint font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-surface-muted transition-colors text-sm font-medium text-ink disabled:opacity-60"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <OTPInput onChange={setOtp} />

              <Button type="submit" fullWidth size="lg" loading={loading} disabled={otp.length < 6}>
                Verify OTP
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:text-ink-faint disabled:cursor-not-allowed flex items-center gap-1 mx-auto"
                >
                  <RefreshCw size={13} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); }}
                className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mx-auto"
              >
                <ArrowLeft size={14} /> Change number
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-ink-faint mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
