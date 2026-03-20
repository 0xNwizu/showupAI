import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, TrendingUp, Calendar, Lock, Users, Bell, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GroupCard } from '@/components/groups/GroupCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CircularProgress } from '@/components/ui/progress'
import { formatSOL, formatDate, getReliabilityGrade, timeAgo } from '@/lib/utils'
import type { Group, GroupMember, Nudge } from '@/types'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('*').eq('auth_id', user.id).single()
  if (!profile) redirect('/signup?complete=1')

  // Fetch groups with member data
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('group:groups(*, members:group_members(*, user:users(*)))')
    .eq('user_id', profile.id)
    .eq('status', 'active')

  type GroupWithMembers = Group & { members: (GroupMember & { user: { display_name: string; avatar_url: string | null } })[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups = ((memberRows || []) as any[]).map((r) => r.group as GroupWithMembers).filter((g): g is GroupWithMembers => !!g)

  const activeGroups = groups.filter((g) => !['completed', 'cancelled'].includes(g.status))
  const committedGroups = groups.filter((g) => {
    const myMembership = g.members?.find((m: GroupMember) => m.user_id === profile.id)
    return myMembership?.committed
  })
  const totalSOLLocked = committedGroups.reduce((sum, g) => sum + Number(g.deposit_amount_sol || 0), 0)

  const upcomingGroups = groups
    .filter((g: Group) => g.event_date && new Date(g.event_date) > new Date())
    .sort((a: Group, b: Group) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())
    .slice(0, 3)

  const { data: nudges } = await supabase
    .from('nudges')
    .select('*, group:groups(name, emoji)')
    .eq('user_id', profile.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: transactions } = await supabase
    .from('mock_transactions')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const reliabilityGrade = getReliabilityGrade(profile.reliability_score)

  const STAT_CARDS = [
    {
      label: 'Mock SOL Balance',
      value: formatSOL(profile.mock_sol_balance, 3),
      icon: '◎',
      color: 'text-solana-green',
      bg: 'from-solana-green/10 to-transparent',
      border: 'border-solana-green/20',
    },
    {
      label: 'Active Squads',
      value: activeGroups.length.toString(),
      icon: '👥',
      color: 'text-brand-cyan',
      bg: 'from-brand-cyan/10 to-transparent',
      border: 'border-brand-cyan/20',
    },
    {
      label: 'SOL Locked',
      value: formatSOL(totalSOLLocked, 3),
      icon: '🔒',
      color: 'text-brand-purple-light',
      bg: 'from-brand-purple/10 to-transparent',
      border: 'border-brand-purple/20',
    },
    {
      label: 'Hangouts Attended',
      value: profile.hangouts_attended.toString(),
      icon: '🎉',
      color: 'text-brand-pink',
      bg: 'from-brand-pink/10 to-transparent',
      border: 'border-brand-pink/20',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">
            Hey, {profile.display_name.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 mt-0.5">
            {activeGroups.length > 0
              ? `You've got ${activeGroups.length} active squad${activeGroups.length > 1 ? 's' : ''}. Let's get planning!`
              : 'Start your first hangout squad below 🚀'}
          </p>
        </div>
        <Link href="/groups/create">
          <Button variant="gradient" leftIcon={<Plus className="w-4 h-4" />}>
            New Squad
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((stat, i) => (
          <Card key={i} className={`bg-gradient-to-br ${stat.bg} border ${stat.border}`} padding="md">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
              <span className={`text-lg ${stat.color}`}>{stat.icon}</span>
            </div>
            <p className={`text-2xl font-black ${stat.color} font-mono`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Squads */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">My Squads</h2>
            <Link href="/groups" className="text-sm text-brand-purple-light hover:text-brand-purple flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {groups.length === 0 ? (
            <Card variant="bordered" className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-brand-purple-light" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No squads yet</h3>
              <p className="text-gray-400 text-sm mb-4">
                Create a group and invite your crew to plan your first hangout.
              </p>
              <Link href="/groups/create">
                <Button variant="gradient" leftIcon={<Plus className="w-4 h-4" />}>
                  Create Your First Squad
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {groups.slice(0, 4).map((group) => {
                const myMembership = group.members?.find((m: GroupMember) => m.user_id === profile.id)
                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    members={group.members as unknown as Parameters<typeof GroupCard>[0]['members']}
                    myMembership={myMembership}
                  />
                )
              })}
              {groups.length > 4 && (
                <Link href="/groups">
                  <Card variant="hover" className="text-center py-4">
                    <p className="text-sm text-gray-400">+{groups.length - 4} more squads</p>
                  </Card>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Reliability score */}
          <Card variant="gradient">
            <CardHeader>
              <CardTitle className="text-sm">Reliability Score</CardTitle>
              <TrendingUp className="w-4 h-4 text-brand-purple-light" />
            </CardHeader>
            <div className="flex items-center gap-4">
              <CircularProgress value={profile.reliability_score} variant="solana" size={72}>
                <span className={`text-lg font-black ${reliabilityGrade.color}`}>
                  {reliabilityGrade.grade}
                </span>
              </CircularProgress>
              <div>
                <p className="text-2xl font-black text-white">{profile.reliability_score}%</p>
                <p className="text-xs text-gray-400">{profile.hangouts_attended} attended</p>
                <p className="text-xs text-gray-400">{profile.total_hangouts} committed</p>
              </div>
            </div>
          </Card>

          {/* Upcoming events */}
          {upcomingGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Upcoming</CardTitle>
                <Calendar className="w-4 h-4 text-brand-cyan" />
              </CardHeader>
              <div className="space-y-2">
                {upcomingGroups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.id}`}>
                    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-dark-border transition-colors">
                      <span className="text-xl">{group.emoji || '🎉'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{group.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(group.event_date!)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Nudges */}
          {nudges && nudges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-pink" />
                  Nudges
                </CardTitle>
                <Badge variant="danger" size="xs">{nudges.length}</Badge>
              </CardHeader>
              <div className="space-y-2">
                {nudges.slice(0, 3).map((nudge: Nudge & { group: { name: string; emoji: string } }) => (
                  <div key={nudge.id} className="p-3 rounded-xl bg-dark-bg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{nudge.group?.emoji || '🤖'}</span>
                      <span className="text-xs text-brand-purple-light font-medium">{nudge.group?.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{nudge.content}</p>
                    <p className="text-xs text-gray-600 mt-1">{timeAgo(nudge.created_at)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent transactions */}
          {transactions && transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Wallet Activity</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {transactions.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        tx.type === 'deposit' ? 'bg-red-500/20 text-red-400' :
                        tx.type === 'initial_airdrop' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {tx.type === 'deposit' ? '↓' : tx.type === 'initial_airdrop' ? '✦' : '↑'}
                      </div>
                      <p className="text-xs text-gray-300 capitalize">
                        {tx.type === 'initial_airdrop' ? 'Airdrop' : tx.type}
                      </p>
                    </div>
                    <span className={`text-xs font-mono font-semibold ${
                      tx.type === 'deposit' ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {tx.type === 'deposit' ? '-' : '+'}◎ {Math.abs(tx.amount_sol).toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
