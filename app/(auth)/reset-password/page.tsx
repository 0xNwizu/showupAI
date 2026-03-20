'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type Step = 'form' | 'done' | 'invalid'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [step, setStep] = useState<Step>('form')
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    // Supabase fires PASSWORD_RECOVERY after the auth callback exchanges the code.
    // If the user lands here without a valid recovery session, send them away.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setChecking(false)
      if (!session) setStep('invalid')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY') setStep('form')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error('Reset failed', { description: error.message })
      return
    }

    setStep('done')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
      </div>
    )
  }

  if (step === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Link expired or invalid</h1>
          <p className="text-gray-400 text-sm mb-6">
            This password reset link has expired or already been used. Request a new one.
          </p>
          <Link href="/login">
            <Button variant="gradient">Back to login</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 shadow-glow-purple">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Password updated</h1>
          <p className="text-gray-400 text-sm mb-6">Your password has been changed. You can now log in.</p>
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl" />
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
          <h1 className="text-2xl font-bold text-white mt-6 mb-1">Set new password</h1>
          <p className="text-gray-400 text-sm">Must be at least 8 characters</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-card">
          <form onSubmit={handleReset} className="space-y-4">
            <Input
              label="New password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              rightElement={
                <button type="button" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <Input
              label="Confirm password"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              required
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              error={confirm && password !== confirm ? 'Passwords do not match' : ''}
              rightElement={
                <button type="button" onClick={() => setShowConfirm(p => !p)}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              loading={loading}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
