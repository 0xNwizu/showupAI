'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Edit3, Save, LogOut, Shield, Zap, TrendingUp,
  Lock, CheckCircle, ExternalLink, Copy,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CircularProgress } from '@/components/ui/progress'
import { useMockWallet } from '@/lib/mock-solana/context'
import { WalletButton } from '@/components/wallet/WalletButton'
import { getMockAddressExplorerUrl } from '@/lib/mock-solana/wallet'
import {
  formatSOL, formatDate, timeAgo, truncateAddress,
  getReliabilityGrade, copyToClipboard,
} from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { User as UserType, MockTransaction } from '@/types'

interface ProfileClientProps {
  profile: UserType
  transactions: MockTransaction[]
  groupMemberships: Array<{
    group: { name: string; emoji: string; status: string; event_date: string | null }
    committed: boolean
    checked_in: boolean
  }>
}

const TX_TYPE_CONFIG = {
  deposit: { label: 'Deposit', color: 'text-red-400', bg: 'bg-red-500/20', sign: '-' },
  return: { label: 'Returned', color: 'text-emerald-400', bg: 'bg-emerald-500/20', sign: '+' },
  reward: { label: 'Reward', color: 'text-solana-green', bg: 'bg-solana-green/20', sign: '+' },
  forfeit: { label: 'Forfeited', color: 'text-red-400', bg: 'bg-red-500/20', sign: '-' },
  initial_airdrop: { label: 'Airdrop', color: 'text-brand-purple-light', bg: 'bg-brand-purple/20', sign: '+' },
}

export function ProfileClient({ profile, transactions, groupMemberships }: ProfileClientProps) {
  const router = useRouter()
  const { connected, address, balance, connect, disconnect, refreshBalance } = useMockWallet()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [bio, setBio] = useState(profile.bio)

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const reliabilityGrade = getReliabilityGrade(profile.reliability_score)

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName, bio }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Profile updated!')
      setIsEditing(false)
      router.refresh()
    } else {
      toast.error('Update failed')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    disconnect()
    router.push('/')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile header */}
      <Card variant="gradient">
        <div className="flex items-start gap-5">
          <div className="relative">
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name}
              size="2xl"
              className="border-4 border-brand-purple/30"
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center">
              <span className="text-sm font-black text-white">{reliabilityGrade.grade}</span>
            </div>
          </div>

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Display name"
                />
                <Textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Your bio..."
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" loading={saving} onClick={handleSave}
                    leftIcon={<Save className="w-4 h-4" />}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-white">{profile.display_name}</h1>
                    <p className="text-gray-400 text-sm">@{profile.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}
                      leftIcon={<Edit3 className="w-4 h-4" />}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}
                      leftIcon={<LogOut className="w-4 h-4" />}>
                      Sign out
                    </Button>
                  </div>
                </div>
                {profile.bio && (
                  <p className="text-gray-400 text-sm mt-2">{profile.bio}</p>
                )}
                <p className="text-xs text-gray-600 mt-2">
                  Member since {formatDate(profile.created_at)}
                </p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Hangouts', value: profile.hangouts_attended, icon: '🎉', color: 'text-brand-pink' },
          { label: 'Committed', value: profile.total_hangouts, icon: '🔒', color: 'text-brand-purple-light' },
          { label: 'Show rate', value: `${profile.reliability_score}%`, icon: '📈', color: 'text-solana-green' },
        ].map(stat => (
          <Card key={stat.label} padding="md" className="text-center">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Reliability score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-purple-light" />
            Reliability Score
          </CardTitle>
        </CardHeader>
        <div className="flex items-center gap-6">
          <CircularProgress value={profile.reliability_score} variant="solana" size={80}>
            <span className={`text-lg font-black ${reliabilityGrade.color}`}>{reliabilityGrade.grade}</span>
          </CircularProgress>
          <div>
            <p className="text-3xl font-black text-white">{profile.reliability_score}%</p>
            <p className="text-sm text-gray-400">
              {profile.hangouts_attended} out of {profile.total_hangouts} hangouts attended
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {profile.reliability_score >= 95
                ? '🏆 Legendary — you never flake'
                : profile.reliability_score >= 80
                  ? '✨ Great — your crew trusts you'
                  : profile.reliability_score >= 60
                    ? '⚠️ Could be better — try to show up more'
                    : '🚨 Flake alert — your reputation is at risk!'}
            </p>
          </div>
        </div>
      </Card>

      {/* Mock Wallet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-solana-green" />
            Mock Wallet
          </CardTitle>
          <WalletButton balance={profile.mock_sol_balance} size="sm" />
        </CardHeader>

        {connected && address ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-dark-bg rounded-2xl">
              <div>
                <p className="text-xs text-gray-500 mb-1">Balance</p>
                <p className="text-2xl font-black text-solana-green">{formatSOL(profile.mock_sol_balance, 4)}</p>
                <p className="text-xs text-gray-600">Mock SOL on ShowUp Network</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-mono text-gray-300">{truncateAddress(address, 6)}</p>
                  <button onClick={() => copyToClipboard(address).then(() => toast.success('Copied!'))}>
                    <Copy className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
              <Shield className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-yellow-400">
                This is a mock wallet for testing. Real Solana integration coming soon.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm mb-3">Connect your mock wallet to commit to hangouts</p>
            <Button variant="solana" onClick={connect}>Connect Wallet</Button>
          </div>
        )}
      </Card>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <span className="text-xs text-gray-500">{transactions.length} transactions</span>
          </CardHeader>
          <div className="space-y-2">
            {transactions.map(tx => {
              const config = TX_TYPE_CONFIG[tx.type]
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-bg transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <span className={`text-xs font-bold ${config.color}`}>{config.sign}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{tx.description || config.label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-600">{timeAgo(tx.created_at)}</p>
                      <span className="text-xs text-gray-700 font-mono">{truncateAddress(tx.tx_hash, 4)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-mono font-bold ${config.color}`}>
                      {config.sign}◎ {Math.abs(tx.amount_sol).toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-600">◎ {tx.balance_after.toFixed(4)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Squad memberships */}
      {groupMemberships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Squads Overview</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {groupMemberships.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-bg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.group.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{m.group.name}</p>
                    {m.group.event_date && (
                      <p className="text-xs text-gray-500">{formatDate(m.group.event_date)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {m.committed && <Badge variant="success" size="xs" dot>Committed</Badge>}
                  {m.checked_in && <Badge variant="success" size="xs">Attended</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
