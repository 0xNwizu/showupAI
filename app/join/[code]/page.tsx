'use client'

import { useEffect, useState, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AvatarGroup } from '@/components/ui/avatar'
import { formatSOL } from '@/lib/utils'
import { toast } from 'sonner'

export default function JoinGroupPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [group, setGroup] = useState<{
    id: string; name: string; emoji: string; description: string
    deposit_amount_sol: number; total_members: number; max_members: number
    members: Array<{ user: { display_name: string; avatar_url: string | null } }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)

      // Use the public API endpoint — direct Supabase query would be blocked by RLS
      // since the visitor is not yet a member of this group
      const res = await fetch(`/api/join?code=${encodeURIComponent(code)}`)
      if (res.ok) {
        const data = await res.json()
        setGroup(data.group)
      }
      setLoading(false)
    }
    load()
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = async () => {
    if (!isLoggedIn) { router.push(`/signup?next=/join/${code}`); return }
    if (!group) return

    setJoining(true)
    const res = await fetch(`/api/groups/${group.id}/join`, { method: 'POST' })
    setJoining(false)

    if (res.ok) {
      toast.success(`Joined ${group.name}! 🎉`)
      router.push(`/groups/${group.id}`)
    } else {
      const data = await res.json()
      toast.error(data.error || 'Failed to join')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-brand-purple border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading invite...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invite not found</h1>
          <p className="text-gray-400 mb-6">This invite code is invalid or has expired.</p>
          <Link href="/dashboard">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const memberAvatars = group.members?.slice(0, 5).map(m => ({
    name: m.user.display_name,
    src: m.user.avatar_url,
  })) || []

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-brand-pink/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
              <span className="text-sm font-bold text-white">SU</span>
            </div>
            <span className="font-bold text-white">ShowUp <span className="text-brand-purple-light">AI</span></span>
          </Link>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-card text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-purple/30 to-brand-pink/20 border border-brand-purple/20 flex items-center justify-center text-4xl mx-auto mb-4">
            {group.emoji || '🎉'}
          </div>

          <p className="text-sm text-gray-400 mb-1">You&apos;re invited to join</p>
          <h1 className="text-2xl font-black text-white mb-2">{group.name}</h1>
          {group.description && (
            <p className="text-gray-400 text-sm mb-4">{group.description}</p>
          )}

          <div className="flex items-center justify-center gap-3 mb-4">
            {memberAvatars.length > 0 && <AvatarGroup users={memberAvatars} size="sm" />}
            <span className="text-sm text-gray-400">
              {group.total_members} / {group.max_members} members
            </span>
          </div>

          <div className="bg-dark-bg rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <Lock className="w-5 h-5 text-solana-green" />
              <div className="text-left">
                <p className="text-xs text-gray-500">Commitment deposit</p>
                <p className="text-lg font-black text-solana-green">{formatSOL(group.deposit_amount_sol, 3)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Show up → get it back. Flake → it goes to those who came.
            </p>
          </div>

          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={handleJoin}
            loading={joining}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isLoggedIn ? `Join ${group.name}` : 'Sign up to Join'}
          </Button>

          {!isLoggedIn && (
            <p className="text-xs text-gray-500 mt-3">
              Already have an account?{' '}
              <Link href={`/login?next=/join/${code}`} className="text-brand-purple-light hover:text-brand-purple">
                Log in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
