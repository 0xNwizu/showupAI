'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, AtSign, Eye, EyeOff, ArrowRight, CheckCircle, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { toast } from 'sonner'
import { isValidEmail, isValidUsername } from '@/lib/utils'

type Step = 'account' | 'confirm-email' | 'profile' | 'done'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // ?complete=1 means the user has a session but no profile — skip to profile step
  const needsProfile = searchParams.get('complete') === '1'

  const [step, setStep] = useState<Step>(needsProfile ? 'profile' : 'account')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(!needsProfile)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [usernameError, setUsernameError] = useState('')

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (!session?.user) {
        setCheckingSession(false)
        return
      }
      // Has session — check if profile exists
      supabase
        .from('users')
        .select('id')
        .eq('auth_id', session.user.id)
        .single()
        .then(({ data: profile }) => {
          if (!mounted) return
          if (profile) {
            router.replace('/dashboard')
          } else {
            setStep('profile')
            setCheckingSession(false)
          }
        })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        supabase
          .from('users')
          .select('id')
          .eq('auth_id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (!mounted) return
            if (profile) {
              router.replace('/dashboard')
            } else {
              setStep('profile')
              setCheckingSession(false)
            }
          })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccountStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) { toast.error('Enter a valid email'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      toast.error('Signup failed', { description: error.message })
      return
    }

    if (data.session) {
      // Email confirmation disabled — go straight to profile
      setStep('profile')
    } else if (data.user) {
      // Email confirmation required
      setStep('confirm-email')
    } else {
      toast.error('Something went wrong. Please try again.')
    }
  }

  const handleProfileStep = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim()) { toast.error('Enter your display name'); return }
    if (!isValidUsername(username)) {
      setUsernameError('3–20 chars: lowercase letters, numbers, underscores only')
      return
    }

    setLoading(true)
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, display_name: displayName, bio }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      if (data.error?.includes('already taken') || data.error?.includes('unique')) {
        setUsernameError('Username is already taken')
      } else {
        toast.error('Profile creation failed', { description: data.error })
      }
      return
    }

    setStep('done')
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
      </div>
    )
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center mx-auto mb-6 shadow-glow-purple animate-float">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">{"You're in! 🎉"}</h1>
          <p className="text-gray-400 mb-4">
            Welcome to ShowUp AI,{' '}
            <span className="text-brand-purple-light font-semibold">{displayName}</span>!
            Your mock wallet has been loaded with{' '}
            <span className="text-solana-green font-bold">◎ 10 SOL</span>.
          </p>
          <div className="bg-dark-card border border-dark-border rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs text-gray-500 mb-2 font-medium">What&apos;s next:</p>
            {[
              'Create or join a hangout group',
              'Connect your wallet (already done! 🎉)',
              'Let AI plan your first hangout',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <div className="w-5 h-5 rounded-full bg-brand-purple/20 border border-brand-purple/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-brand-purple-light font-bold">{i + 1}</span>
                </div>
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // ── Check email ────────────────────────────────────────────────────────────
  if (step === 'confirm-email') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-3xl bg-brand-cyan/10 border-2 border-brand-cyan/30 flex items-center justify-center mx-auto mb-6">
            <MailCheck className="w-10 h-10 text-brand-cyan" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Check your inbox</h1>
          <p className="text-gray-400 mb-1">We sent a confirmation link to</p>
          <p className="text-brand-purple-light font-semibold mb-6">{email}</p>
          <div className="bg-dark-card border border-dark-border rounded-2xl p-4 mb-4 text-left space-y-2">
            <p className="text-xs text-gray-400">1. Open the email and click &quot;Confirm your email&quot;</p>
            <p className="text-xs text-gray-400">2. You&apos;ll be brought back here to finish your profile</p>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            💡 To skip this in development: Supabase dashboard → Authentication → Settings → disable &quot;Enable email confirmations&quot;
          </p>
          <Button
            variant="ghost"
            size="sm"
            loading={loading}
            onClick={async () => {
              setLoading(true)
              await supabase.auth.resend({ type: 'signup', email })
              setLoading(false)
              toast.success('Confirmation email resent!')
            }}
          >
            Resend email
          </Button>
        </div>
      </div>
    )
  }

  // ── Account + Profile steps ────────────────────────────────────────────────
  const stepIndex = step === 'account' ? 0 : 1

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-brand-pink/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center">
              <span className="text-base font-bold text-white">SU</span>
            </div>
            <span className="font-bold text-white text-xl">
              ShowUp <span className="text-brand-purple-light">AI</span>
            </span>
          </Link>

          <div className="flex items-center justify-center gap-2 mt-6">
            {['Account', 'Profile'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < stepIndex
                    ? 'bg-brand-purple text-white'
                    : i === stepIndex
                      ? 'bg-gradient-brand text-white'
                      : 'bg-dark-border text-gray-600'
                }`}>
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${i === stepIndex ? 'text-white' : 'text-gray-600'}`}>{s}</span>
                {i === 0 && <div className="w-8 h-px bg-dark-border" />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-card">
          {step === 'account' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
              <p className="text-gray-400 text-sm mb-6">Join the ShowUp movement</p>
              <form onSubmit={handleAccountStep} className="space-y-4">
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
                <Input
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  hint="Min. 8 characters"
                  leftIcon={<Lock className="w-4 h-4" />}
                  autoComplete="new-password"
                  rightElement={
                    <button type="button" onClick={() => setShowPw(p => !p)}>
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full"
                  rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Continue
                </Button>
              </form>
            </>
          )}

          {step === 'profile' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Set up your profile</h1>
              <p className="text-gray-400 text-sm mb-6">Tell your future hangout crew who you are</p>
              <form onSubmit={handleProfileStep} className="space-y-4">
                <Input
                  label="Display Name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your real name or nickname"
                  required
                  leftIcon={<User className="w-4 h-4" />}
                  autoComplete="name"
                />
                <Input
                  label="Username"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                    setUsernameError('')
                  }}
                  placeholder="your_username"
                  required
                  error={usernameError}
                  hint="Lowercase letters, numbers, underscores. 3–20 chars."
                  leftIcon={<AtSign className="w-4 h-4" />}
                  autoComplete="username"
                  maxLength={20}
                />
                <Textarea
                  label="Bio (optional)"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Always down for good food and late-night adventures..."
                  rows={3}
                />
                <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full"
                  rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Create Profile
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-purple-light hover:text-brand-purple transition-colors font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
