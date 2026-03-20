'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Users, Share2, Settings, Lock, CheckCircle,
  Calendar, MapPin, Sparkles, Bell, UserPlus, Copy, ChevronRight,
  Zap, AlertCircle, Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarGroup } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { LoadingPage } from '@/components/ui/spinner'
import { PlannerChat } from '@/components/ai/PlannerChat'
import { PlanDisplay } from '@/components/ai/PlanDisplay'
import { AvailabilityForm } from '@/components/ai/AvailabilityForm'
import { InviteModal } from '@/components/groups/InviteModal'
import { MockTransactionModal } from '@/components/wallet/MockTransactionModal'
import { createClient } from '@/lib/supabase/client'
import { useMockWallet } from '@/lib/mock-solana/context'
import { generateMockSolanaAddress } from '@/lib/mock-solana/wallet'
import {
  formatSOL, formatDate, getCountdown, timeAgo,
  getEventEmoji, truncateAddress,
} from '@/lib/utils'
import { GROUP_STATUS_LABELS, GROUP_STATUS_COLORS } from '@/types'
import type { GroupWithDetails, AvailabilityFormData, AIConversation } from '@/types'
import { toast } from 'sonner'

type Tab = 'overview' | 'plan' | 'availability' | 'chat' | 'members'

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const { address: walletAddress, connect, connected } = useMockWallet()

  const [group, setGroup] = useState<GroupWithDetails | null>(null)
  const [profile, setProfile] = useState<{ id: string; display_name: string; avatar_url: string | null; mock_sol_balance: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Modal states
  const [showInvite, setShowInvite] = useState(false)
  const [showCommitModal, setShowCommitModal] = useState(false)
  const [showAvailability, setShowAvailability] = useState(false)

  // Action states
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [isSubmittingAvailability, setIsSubmittingAvailability] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isSendingNudge, setIsSendingNudge] = useState(false)
  const [isResolvingEvent, setIsResolvingEvent] = useState(false)

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  async function fetchData(silent = false) {
    if (!silent) setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase
      .from('users').select('id, display_name, avatar_url, mock_sol_balance').eq('auth_id', user.id).single()
    if (profileData) setProfile(profileData)

    const { data: groupData } = await supabase
      .from('groups')
      .select(`*, creator:users!groups_created_by_fkey(*), members:group_members(*, user:users(*))`)
      .eq('id', groupId)
      .single()

    if (!groupData) { router.push('/groups'); return }
    if (!profileData) return

    const [availRes, commitRes, convRes, nudgeRes] = await Promise.all([
      supabase.from('availability_responses').select('*').eq('group_id', groupId).eq('user_id', profileData.id).single(),
      supabase.from('commitments').select('*').eq('group_id', groupId).eq('user_id', profileData.id).single(),
      supabase.from('ai_conversations').select('*').eq('group_id', groupId).order('created_at').limit(50),
      supabase.from('nudges').select('*').eq('group_id', groupId).eq('user_id', profileData.id).order('created_at', { ascending: false }).limit(5),
    ])

    const activeMembers = (groupData.members || []).filter((m: { status: string }) => m.status === 'active')
    const committedMembers = activeMembers.filter((m: { committed: boolean }) => m.committed)

    setGroup({
      ...groupData,
      members: activeMembers,
      my_membership: activeMembers.find((m: { user_id: string }) => m.user_id === profileData.id) ?? null,
      my_availability: availRes.data ?? null,
      my_commitment: commitRes.data ?? null,
      conversations: convRes.data ?? [],
      recent_nudges: nudgeRes.data ?? [],
      commitment_progress: {
        committed_count: committedMembers.length,
        total_count: activeMembers.length,
        percentage: activeMembers.length > 0 ? Math.round((committedMembers.length / activeMembers.length) * 100) : 0,
        total_sol_locked: committedMembers.length * groupData.deposit_amount_sol,
        committed_members: committedMembers.map((m: { user_id: string }) => m.user_id),
        uncommitted_members: activeMembers.filter((m: { committed: boolean }) => !m.committed).map((m: { user_id: string }) => m.user_id),
      },
    })
    if (!silent) setLoading(false)
  }

  const handleSendMessage = async (content: string) => {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, message: content }),
    })
    if (res.ok) await fetchData(true)
  }

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true)
    const res = await fetch('/api/ai/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId }),
    })
    setIsGeneratingPlan(false)
    if (res.ok) {
      toast.success('Plan generated! 🎉')
      await fetchData(true)
      setActiveTab('plan')
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error('Plan generation failed', { description: data.error || 'Unknown error' })
    }
  }

  const handleAvailabilitySubmit = async (data: AvailabilityFormData) => {
    setIsSubmittingAvailability(true)
    const res = await fetch(`/api/groups/${groupId}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setIsSubmittingAvailability(false)
    if (res.ok) {
      toast.success('Availability submitted! 🙌')
      setShowAvailability(false)
      await fetchData(true)
    } else {
      toast.error('Failed to submit availability')
    }
  }

  const handleCommit = async (): Promise<{ success: boolean; txHash: string }> => {
    const mockTo = generateMockSolanaAddress()
    const res = await fetch('/api/commitments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId }),
    })
    const data = await res.json()
    if (res.ok) {
      fetchData(true).catch(() => {})
      return { success: true, txHash: data.txHash }
    }
    throw new Error(data.error || 'Transaction failed')
  }

  const handleCheckIn = async () => {
    setIsCheckingIn(true)
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId }),
    })
    const data = await res.json()
    setIsCheckingIn(false)
    if (res.ok) {
      toast.success('Checked in! Your SOL is on its way back 🎉', {
        description: `◎ ${data.returnedAmount} SOL returned to your wallet`,
      })
      await fetchData(true)
    } else {
      toast.error(data.error || 'Check-in failed')
    }
  }

  const handleVote = async (vote: 'approve' | 'veto') => {
    const res = await fetch(`/api/groups/${groupId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote }),
    })
    const data = await res.json()
    if (res.ok) {
      if (data.approved) {
        toast.success('Plan approved! 🎉 Deposits are now open.', {
          description: `${data.approveCount}/${data.totalVoters} members approved`,
        })
      } else {
        toast.success(vote === 'approve' ? 'Vote recorded 👍' : 'Vote recorded 👎')
      }
      await fetchData(true)
    } else {
      toast.error(data.error || 'Failed to record vote')
    }
  }

  const handleResolveEvent = async () => {
    setIsResolvingEvent(true)
    const res = await fetch(`/api/groups/${groupId}/resolve`, { method: 'POST' })
    const data = await res.json()
    setIsResolvingEvent(false)
    if (res.ok) {
      if (data.noShows > 0 && data.attendees > 0) {
        toast.success(`Event closed! ◎ ${data.bonusPerAttendee} SOL bonus sent to ${data.attendees} attendee${data.attendees > 1 ? 's' : ''} 🏆`, {
          description: `${data.noShows} no-show${data.noShows > 1 ? 's' : ''} forfeited ◎ ${data.totalForfeited} SOL total`,
        })
      } else if (data.noShows > 0) {
        toast.success(`Event closed. ${data.noShows} member${data.noShows > 1 ? 's' : ''} forfeited their deposit.`)
      } else {
        toast.success('Event closed — everyone showed up! 🎉')
      }
      await fetchData(true)
    } else {
      toast.error(data.error || 'Failed to close event')
    }
  }

  const handleSendNudge = async (type: string) => {
    setIsSendingNudge(true)
    const res = await fetch('/api/ai/nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, nudgeType: type }),
    })
    setIsSendingNudge(false)
    if (res.ok) {
      const data = await res.json()
      toast.success(`Nudged ${data.count} member${data.count > 1 ? 's' : ''}! 📲`)
    } else {
      toast.error('Failed to send nudges')
    }
  }

  if (loading) return <LoadingPage message="Loading squad..." />
  if (!group || !profile) return null

  const isAdmin = group.my_membership?.role === 'admin'
  const myMembership = group.my_membership
  const hasCommitted = myMembership?.committed ?? false
  const hasCheckedIn = myMembership?.checked_in ?? false
  const hasSubmittedAvailability = myMembership?.availability_submitted ?? false
  const hasPlan = !!group.ai_plan
  const canGeneratePlan = (group.members?.length ?? 0) >= 2
  const isEventDay = group.event_date && Math.abs(new Date(group.event_date).getTime() - Date.now()) < 1000 * 60 * 60 * 24

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'plan', label: 'Plan', badge: hasPlan ? undefined : undefined },
    { id: 'availability', label: 'Availability' },
    { id: 'chat', label: 'AI Chat' },
    { id: 'members', label: `Crew (${group.members?.length ?? 0})` },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/groups">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Squads
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-purple/30 to-brand-pink/20 border border-brand-purple/20 flex items-center justify-center text-2xl">
              {group.emoji || getEventEmoji(group.event_type)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{group.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={GROUP_STATUS_COLORS[group.status]} dot={group.status === 'active'}>
                  {GROUP_STATUS_LABELS[group.status]}
                </Badge>
                {group.event_date && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(group.event_date)} · {getCountdown(group.event_date)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowInvite(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Invite
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSendNudge('reminder')}
              loading={isSendingNudge}
              leftIcon={<Bell className="w-4 h-4" />}
            >
              Nudge All
            </Button>
          )}
          {isAdmin && group.status !== 'completed' && group.status !== 'cancelled' && group.commitment_progress.committed_count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResolveEvent}
              loading={isResolvingEvent}
              leftIcon={<Trophy className="w-4 h-4 text-yellow-400" />}
              className="text-yellow-400 hover:text-yellow-300"
            >
              Close Event
            </Button>
          )}
        </div>
      </div>

      {/* Action banners */}
      {!hasSubmittedAvailability && group.status === 'planning' && (
        <div className="mb-4 p-4 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-purple/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-brand-purple-light" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Submit your availability</p>
              <p className="text-xs text-gray-400">Help ShowUp AI plan the perfect hangout</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => { setShowAvailability(true); setActiveTab('availability') }}>
            Fill In Now
          </Button>
        </div>
      )}

      {hasPlan && !hasCommitted && group.status !== 'completed' && group.status !== 'cancelled' && (
        <div className="mb-4 p-4 rounded-2xl bg-solana-green/10 border border-solana-green/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-solana-green/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-solana-green" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Lock your deposit</p>
              <p className="text-xs text-gray-400">
                Commit ◎ {group.deposit_amount_sol} SOL to secure your spot
              </p>
            </div>
          </div>
          <Button variant="solana" size="sm" onClick={() => setShowCommitModal(true)}>
            Lock SOL
          </Button>
        </div>
      )}

      {hasCommitted && !hasCheckedIn && isEventDay && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-4 animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">🎉 It's happening today!</p>
              <p className="text-xs text-gray-400">Check in to get your ◎ {group.deposit_amount_sol} SOL back</p>
            </div>
          </div>
          <Button variant="primary" size="sm" loading={isCheckingIn} onClick={handleCheckIn}
            className="bg-emerald-500 hover:bg-emerald-400">
            Check In
          </Button>
        </div>
      )}

      {hasCheckedIn && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-sm font-semibold text-emerald-400">
            You checked in! ◎ {group.deposit_amount_sol} SOL has been returned to your wallet 🎉
          </p>
        </div>
      )}

      {group.status === 'completed' && (
        <div className="mb-4 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-sm font-semibold text-yellow-400">This event is closed</p>
            <p className="text-xs text-gray-400">
              {hasCheckedIn
                ? 'You attended — your deposit was returned and any no-show bonuses have been sent.'
                : hasCommitted
                  ? 'You did not check in — your deposit was forfeited.'
                  : 'Squad wrapped up.'}
            </p>
          </div>
        </div>
      )}

      {/* Commitment progress */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-solana-green" />
            <span className="text-sm font-semibold text-white">
              {group.commitment_progress.committed_count}/{group.commitment_progress.total_count} committed
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-solana-green">
              ◎ {group.commitment_progress.total_sol_locked.toFixed(3)} locked
            </span>
          </div>
        </div>
        <Progress
          value={group.commitment_progress.percentage}
          variant="solana"
          size="md"
          showValue
          label={`${group.commitment_progress.percentage}% committed`}
        />
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30'
                : 'text-gray-400 hover:text-white hover:bg-dark-card'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-brand-pink text-white text-xs">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Group info */}
          <Card>
            <CardHeader>
              <CardTitle>Squad Info</CardTitle>
            </CardHeader>
            {group.description && (
              <p className="text-sm text-gray-400 mb-3">{group.description}</p>
            )}
            <div className="space-y-2">
              {group.event_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-brand-purple-light" />
                  <span className="text-gray-300">{formatDate(group.event_date)}</span>
                </div>
              )}
              {group.event_location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-brand-pink" />
                  <span className="text-gray-300">{group.event_location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-solana-green" />
                <span className="text-gray-300">◎ {group.deposit_amount_sol} SOL deposit</span>
              </div>
            </div>

            {/* Invite code */}
            <div className="mt-4 p-3 bg-dark-bg rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Invite Code</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-brand-purple-light">{group.invite_code.toUpperCase().slice(0, 6)}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(group.invite_code); toast.success('Copied!') }}
                  className="text-gray-500 hover:text-gray-300"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {!hasSubmittedAvailability && (
                <button
                  onClick={() => { setShowAvailability(true); setActiveTab('availability') }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-brand-purple/10 border border-brand-purple/20 hover:bg-brand-purple/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-purple-light" />
                    <span className="text-sm font-medium text-white">Submit availability</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              )}

              {hasPlan && !hasCommitted && (
                <button
                  onClick={() => setShowCommitModal(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-solana-green/10 border border-solana-green/20 hover:bg-solana-green/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-solana-green" />
                    <span className="text-sm font-medium text-white">Lock SOL deposit</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              )}

              {!hasPlan && canGeneratePlan && isAdmin && (
                <button
                  onClick={handleGeneratePlan}
                  disabled={isGeneratingPlan}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-brand-purple/20 to-brand-pink/10 border border-brand-purple/20 hover:opacity-80 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-purple-light" />
                    <span className="text-sm font-medium text-white">
                      {isGeneratingPlan ? 'Generating plan...' : 'Generate AI plan'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              )}

              <button
                onClick={() => setShowInvite(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-dark-border/50 hover:bg-dark-border transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-brand-cyan" />
                  <span className="text-sm font-medium text-white">Invite friends</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-dark-border/50 hover:bg-dark-border transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-pink" />
                  <span className="text-sm font-medium text-white">Chat with ShowUp AI</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </Card>

          {/* Member overview */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Crew ({group.members?.length ?? 0})</CardTitle>
              <button onClick={() => setActiveTab('members')} className="text-xs text-brand-purple-light hover:text-brand-purple">
                View all
              </button>
            </CardHeader>
            <div className="flex flex-wrap gap-3">
              {group.members?.slice(0, 8).map(member => (
                <div key={member.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-bg border border-dark-border">
                  <Avatar src={member.user.avatar_url} name={member.user.display_name} size="xs" />
                  <div>
                    <p className="text-xs font-medium text-white">{member.user.display_name}</p>
                    <div className="flex items-center gap-1">
                      {member.committed && <Lock className="w-2.5 h-2.5 text-solana-green" />}
                      {member.checked_in && <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />}
                      {!member.committed && !member.checked_in && (
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="space-y-4">
          {hasPlan ? (
            <>
              {/* Replan option for admin when threshold not met */}
              {(() => {
                const votes = group.ai_plan?.member_votes || []
                const totalMembers = group.members?.length || 0
                const approveCount = votes.filter(v => v.vote === 'approve').length
                const threshold = Math.ceil(totalMembers * 0.75)
                const votedCount = votes.length
                const notApproved = approveCount < threshold
                const canStillReach = (totalMembers - votes.filter(v => v.vote === 'veto').length) >= threshold
                const deadlocked = !canStillReach && votedCount > 0

                if (isAdmin && notApproved && (deadlocked || votedCount >= totalMembers) && group.status === 'plan_ready') {
                  return (
                    <div className="p-4 rounded-2xl bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">Plan not approved</p>
                        <p className="text-xs text-gray-400">
                          {approveCount}/{threshold} needed · Generate a new plan with different options
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGeneratePlan}
                        loading={isGeneratingPlan}
                        leftIcon={<Sparkles className="w-4 h-4" />}
                      >
                        Replan
                      </Button>
                    </div>
                  )
                }
                return null
              })()}

              <PlanDisplay
                plan={group.ai_plan!}
                depositAmountSol={group.deposit_amount_sol}
                totalVoters={group.members?.length || 0}
                approveCount={(group.ai_plan?.member_votes || []).filter(v => v.vote === 'approve').length}
                myVote={group.ai_plan?.member_votes?.find(v => v.user_id === profile.id)?.vote ?? null}
                onVote={group.status === 'plan_ready' ? handleVote : undefined}
              />
            </>
          ) : (
            <Card variant="bordered" className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 animate-float">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No plan yet</h3>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                {!canGeneratePlan
                  ? 'Invite at least 2 members and collect availability to generate a plan.'
                  : 'Once everyone submits their availability, AI will generate the perfect plan.'}
              </p>
              {canGeneratePlan && isAdmin && (
                <Button
                  variant="gradient"
                  onClick={handleGeneratePlan}
                  loading={isGeneratingPlan}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  {isGeneratingPlan ? 'Generating plan...' : 'Generate Plan Now'}
                </Button>
              )}
            </Card>
          )}
        </div>
      )}

      {activeTab === 'availability' && (
        <div>
          {showAvailability || !hasSubmittedAvailability ? (
            <Card>
              <AvailabilityForm
                initialData={group.my_availability ? {
                  available_dates: group.my_availability.available_dates,
                  budget_range: group.my_availability.budget_range!,
                  vibe_preferences: group.my_availability.vibe_preferences,
                  dietary_restrictions: group.my_availability.dietary_restrictions,
                  transport: group.my_availability.transport,
                  max_travel_time: group.my_availability.max_travel_time,
                  notes: group.my_availability.notes,
                } : undefined}
                onSubmit={handleAvailabilitySubmit}
                isSubmitting={isSubmittingAvailability}
                groupName={group.name}
              />
            </Card>
          ) : (
            <div className="space-y-4">
              <Card variant="gradient">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-white">Availability submitted!</p>
                    <p className="text-xs text-gray-400">Updated {timeAgo(group.my_availability!.updated_at)}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setShowAvailability(true)}>
                    Edit
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Available dates</p>
                    <p className="text-gray-300">{group.my_availability?.available_dates?.length ?? 0} days selected</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Budget</p>
                    <p className="text-gray-300 capitalize">{group.my_availability?.budget_range || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vibes</p>
                    <p className="text-gray-300">{group.my_availability?.vibe_preferences?.join(', ') || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Transport</p>
                    <p className="text-gray-300 capitalize">{group.my_availability?.transport || 'Any'}</p>
                  </div>
                </div>
              </Card>

              {/* Others' submission status */}
              <Card>
                <CardHeader>
                  <CardTitle>Crew Submissions</CardTitle>
                </CardHeader>
                <div className="space-y-2">
                  {group.members?.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <Avatar src={m.user.avatar_url} name={m.user.display_name} size="xs" />
                        <span className="text-sm text-gray-300">{m.user.display_name}</span>
                      </div>
                      {m.availability_submitted ? (
                        <Badge variant="success" size="xs" dot>Submitted</Badge>
                      ) : (
                        <Badge variant="warning" size="xs">Pending</Badge>
                      )}
                    </div>
                  ))}
                </div>

                {isAdmin && group.members?.some(m => !m.availability_submitted) && (
                  <div className="mt-3 pt-3 border-t border-dark-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleSendNudge('reminder')}
                      loading={isSendingNudge}
                      leftIcon={<Bell className="w-4 h-4" />}
                    >
                      Nudge those who haven't submitted
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <Card padding="none" className="overflow-hidden h-[600px] flex flex-col">
          <PlannerChat
            group={group}
            userId={profile.id}
            userName={profile.display_name}
            userAvatar={profile.avatar_url}
            messages={group.conversations}
            onSendMessage={handleSendMessage}
            onGeneratePlan={handleGeneratePlan}
            isGeneratingPlan={isGeneratingPlan}
            canGeneratePlan={canGeneratePlan && isAdmin}
          />
        </Card>
      )}

      {activeTab === 'members' && (
        <Card>
          <CardHeader>
            <CardTitle>Crew Members ({group.members?.length})</CardTitle>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setShowInvite(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
                Invite
              </Button>
            )}
          </CardHeader>
          <div className="space-y-2">
            {group.members?.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-bg transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar src={member.user.avatar_url} name={member.user.display_name} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white text-sm">{member.user.display_name}</p>
                      {member.role === 'admin' && (
                        <Badge variant="purple" size="xs">Admin</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">@{member.user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.availability_submitted && (
                    <Badge variant="info" size="xs">✓ Avail</Badge>
                  )}
                  {member.committed && (
                    <Badge variant="success" size="xs" dot>Committed</Badge>
                  )}
                  {member.checked_in && (
                    <Badge variant="success" size="xs">Checked In</Badge>
                  )}
                  {!member.committed && !member.checked_in && (
                    <Badge variant="default" size="xs">Pending</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isAdmin && group.commitment_progress.uncommitted_members.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dark-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleSendNudge('commitment_push')}
                loading={isSendingNudge}
                leftIcon={<Zap className="w-4 h-4" />}
              >
                Nudge uncommitted members ({group.commitment_progress.uncommitted_members.length})
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <InviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        groupName={group.name}
        inviteCode={group.invite_code}
        groupId={groupId}
      />

      <MockTransactionModal
        open={showCommitModal}
        onClose={() => setShowCommitModal(false)}
        onConfirm={handleCommit}
        fromAddress={walletAddress || ''}
        toAddress={generateMockSolanaAddress()}
        amount={group.deposit_amount_sol}
        description={`Deposit locked for "${group.name}"`}
        purpose={`Hangout commitment — ${group.name}${group.ai_plan ? ': ' + group.ai_plan.title : ''}`}
      />
    </div>
  )
}
