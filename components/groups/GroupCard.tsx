'use client'

import Link from 'next/link'
import { Users, Calendar, Lock, CheckCircle, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AvatarGroup } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { formatSOL, formatDate, getCountdown, getEventEmoji } from '@/lib/utils'
import { GROUP_STATUS_LABELS, GROUP_STATUS_COLORS } from '@/types'
import type { Group, GroupMemberWithUser } from '@/types'

interface GroupCardProps {
  group: Group
  members?: GroupMemberWithUser[]
  myMembership?: { committed: boolean; checked_in: boolean } | null
  compact?: boolean
}

export function GroupCard({ group, members = [], myMembership, compact = false }: GroupCardProps) {
  const committedCount = members.filter(m => m.committed).length
  const totalCount = members.filter(m => m.status === 'active').length
  const commitPercentage = totalCount > 0 ? Math.round((committedCount / totalCount) * 100) : 0

  const memberAvatars = members
    .filter(m => m.status === 'active')
    .slice(0, 5)
    .map(m => ({ name: m.user.display_name, src: m.user.avatar_url }))

  const statusVariant = (): 'success' | 'warning' | 'info' | 'purple' | 'default' | 'danger' => {
    switch (group.status) {
      case 'committed': case 'active': return 'success'
      case 'plan_ready': case 'committing': return 'info'
      case 'ai_planning': case 'collecting_availability': return 'purple'
      case 'cancelled': return 'danger'
      default: return 'default'
    }
  }

  if (compact) {
    return (
      <Link href={`/groups/${group.id}`}>
        <Card variant="hover" className="group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-purple/20 flex items-center justify-center text-xl flex-shrink-0">
              {group.emoji || getEventEmoji(group.event_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{group.name}</p>
              <p className="text-xs text-gray-500">{group.total_members} members</p>
            </div>
            <Badge variant={statusVariant()} size="xs">
              {GROUP_STATUS_LABELS[group.status]}
            </Badge>
          </div>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/groups/${group.id}`} className="block group">
      <Card variant="hover" className="transition-all duration-300 group-hover:border-brand-purple/40 group-hover:shadow-card-hover">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-purple/30 to-brand-pink/20 flex items-center justify-center text-2xl border border-brand-purple/20">
              {group.emoji || getEventEmoji(group.event_type)}
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">{group.name}</h3>
              {group.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{group.description}</p>
              )}
            </div>
          </div>
          <Badge variant={statusVariant()} dot={group.status === 'active'}>
            {GROUP_STATUS_LABELS[group.status]}
          </Badge>
        </div>

        {/* Event info */}
        {group.event_date && (
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
            <Calendar className="w-4 h-4 text-brand-purple-light" />
            <span>{formatDate(group.event_date)}</span>
            <span className="text-gray-600">·</span>
            <span className="text-brand-purple-light text-xs">{getCountdown(group.event_date)}</span>
          </div>
        )}

        {/* Members */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {memberAvatars.length > 0 ? (
              <AvatarGroup users={memberAvatars} max={4} size="xs" />
            ) : (
              <div className="flex items-center gap-1.5 text-gray-500">
                <Users className="w-4 h-4" />
                <span className="text-sm">No members yet</span>
              </div>
            )}
            {totalCount > 0 && (
              <span className="text-xs text-gray-500 ml-1">{totalCount} crew</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-solana-green">
            <span className="font-bold">{formatSOL(group.deposit_amount_sol, 2)}</span>
            <span className="text-gray-500">deposit</span>
          </div>
        </div>

        {/* Commitment progress */}
        {totalCount > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Lock className="w-3 h-3" />
                <span>{committedCount}/{totalCount} committed</span>
              </div>
              <span className="text-xs text-solana-green font-semibold">{commitPercentage}%</span>
            </div>
            <Progress
              value={commitPercentage}
              variant="solana"
              size="xs"
              animated={commitPercentage > 0}
            />
          </div>
        )}

        {/* My status */}
        {myMembership && (
          <div className="mt-3 pt-3 border-t border-dark-border flex items-center gap-3">
            <div className={`flex items-center gap-1.5 text-xs ${myMembership.committed ? 'text-solana-green' : 'text-gray-500'}`}>
              {myMembership.committed ? (
                <><Lock className="w-3.5 h-3.5" /><span>Committed</span></>
              ) : (
                <><Zap className="w-3.5 h-3.5" /><span>Not committed</span></>
              )}
            </div>
            {myMembership.checked_in && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Checked in</span>
              </div>
            )}
          </div>
        )}
      </Card>
    </Link>
  )
}
