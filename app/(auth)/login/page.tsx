'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { isValidEmail } from '@/lib/utils'

type Step = 'login' | 'forgot' | 'forgot-sent'

// Shell is defined OUTSIDE LoginPage so it never remounts on re-render
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-brand-pink/8 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-purple/30 group-hover:shadow-glow-purple transition-shadow">
              <span className="text-base font-bold text-white">SU</span>
            </div>
            <span className="font-bold text-white text-xl">
              ShowUp <span className="text-brand-purple-light">AI</span>
            </span>
          </Link>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-card">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [step, setStep] = useState<Step>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error('Login failed', { description: error.message })
      return
    }
    toast.success('Welcome back!')
    router.push('/dashboard')
    router.refresh()
  }

  const handleMagicLink = async () => {
    if (!email) { toast.error('Enter your email first'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
    setLoading(false)
    if (error) {
      toast.error('Error', { description: error.message })
    } else {
      toast.success('Magic link sent!', { description: `Check ${email} for your login link.` })
    }
  }

  const handleForgotPassword = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!isValidEmail(email)) { toast.error('Enter a valid email address'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (error) {
      toast.error('Error', { description: error.message })
      return
    }
    setStep('forgot-sent')
  }

  if (step === 'forgot-sent') {
    return (
      <Shell>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mx-auto mb-4">
            <MailCheck className="w-8 h-8 text-brand-cyan" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Check your inbox</h1>
          <p className="text-gray-400 text-sm mb-1">We sent a reset link to</p>
          <p className="text-brand-purple-light font-semibold mb-6">{email}</p>
          <div className="bg-dark-bg rounded-xl p-4 mb-6 text-left space-y-1.5">
            <p className="text-xs text-gray-400">1. Open the email and click the reset link</p>
            <p className="text-xs text-gray-400">2. You&apos;ll be brought back to set a new password</p>
            <p className="text-xs text-gray-400">3. Link expires in 1 hour</p>
          </div>
          <Button variant="ghost" size="sm" loading={loading} onClick={() => handleForgotPassword()} className="mb-3">
            Resend email
          </Button>
          <button onClick={() => setStep('login')} className="block w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Back to login
          </button>
        </div>
      </Shell>
    )
  }

  if (step === 'forgot') {
    return (
      <Shell>
        <button onClick={() => setStep('login')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </button>
        <h1 className="text-xl font-bold text-white mb-1">Reset your password</h1>
        <p className="text-gray-400 text-sm mb-6">
          Enter your account email and we&apos;ll send you a reset link.
        </p>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
          />
          <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Send reset link
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          Remember your password?{' '}
          <button onClick={() => setStep('login')} className="text-brand-purple-light hover:text-brand-purple transition-colors font-medium">
            Log in
          </button>
        </p>
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
      <p className="text-gray-400 text-sm mb-6">Log in to your squad</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
        />
        <div>
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button type="button" onClick={() => setShowPw(p => !p)}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            autoComplete="current-password"
          />
          <div className="text-right mt-1.5">
            <button type="button" onClick={() => setStep('forgot')} className="text-xs text-gray-500 hover:text-brand-purple-light transition-colors">
              Forgot password?
            </button>
          </div>
        </div>
        <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
          Log In
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-dark-border" />
        <span className="text-xs text-gray-600">OR</span>
        <div className="flex-1 h-px bg-dark-border" />
      </div>

      <Button variant="secondary" size="lg" className="w-full" onClick={handleMagicLink} loading={loading} leftIcon={<Mail className="w-4 h-4" />}>
        Send Magic Link
      </Button>

      <p className="text-center text-sm text-gray-500 mt-6">
        New to ShowUp AI?{' '}
        <Link href="/signup" className="text-brand-purple-light hover:text-brand-purple transition-colors font-medium">
          Create account
        </Link>
      </p>
    </Shell>
  )
}
