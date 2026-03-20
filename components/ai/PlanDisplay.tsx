'use client'

import { useState } from 'react'
import {
  MapPin, Clock, DollarSign, Users, Zap, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, ExternalLink, Calendar, Utensils, CheckCircle2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatDate, formatUSD, formatSOL } from '@/lib/utils'
import type { AIPlan } from '@/types'

interface PlanDisplayProps {
  plan: AIPlan
  depositAmountSol: number
  onVote?: (vote: 'approve' | 'veto') => void
  myVote?: 'approve' | 'veto' | 'neutral' | null
  approveCount?: number
  totalVoters?: number
}

export function PlanDisplay({
  plan,
  depositAmountSol,
  onVote,
  myVote,
  approveCount = 0,
  totalVoters = 0,
}: PlanDisplayProps) {
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [showItinerary, setShowItinerary] = useState(true)

  const thresholdNeeded = Math.ceil(totalVoters * 0.75)
  const approvalPct = totalVoters > 0 ? Math.round((approveCount / totalVoters) * 100) : 0
  const thresholdPct = totalVoters > 0 ? Math.round((thresholdNeeded / totalVoters) * 100) : 75
  const isApproved = approveCount >= thresholdNeeded && thresholdNeeded > 0

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <Card variant="gradient" className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-pink/10 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <Badge variant="purple" dot>AI Generated Plan</Badge>
            <p className="text-xs text-gray-500">
              {new Date(plan.generated_at).toLocaleDateString()}
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{plan.title}</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">{plan.summary}</p>

          {/* Vibe tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {plan.vibe_tags.map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-purple/20 text-brand-purple-light border border-brand-purple/20"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Key details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: <Calendar className="w-4 h-4 text-brand-purple-light" />,
                label: 'Date',
                value: plan.date === 'TBD' ? 'TBD' : formatDate(plan.date),
              },
              {
                icon: <Clock className="w-4 h-4 text-brand-cyan" />,
                label: 'Time',
                value: `${plan.time} · ${plan.duration_hours}h`,
              },
              {
                icon: <MapPin className="w-4 h-4 text-brand-pink" />,
                label: 'Location',
                value: plan.location.neighborhood || plan.location.name,
              },
              {
                icon: <DollarSign className="w-4 h-4 text-solana-green" />,
                label: 'Per person',
                value: formatUSD(plan.budget_breakdown.per_person_usd),
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-2.5 bg-dark-bg/50 rounded-xl p-3">
                {icon}
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Why this plan */}
      <Card variant="default">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Why ShowUp AI chose this</p>
            <p className="text-sm text-gray-300 leading-relaxed">{plan.why_this_plan}</p>
          </div>
        </div>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-pink" />
            Location
          </CardTitle>
          {plan.location.google_maps_url && (
            <a
              href={plan.location.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-purple-light hover:text-brand-purple flex items-center gap-1"
            >
              Maps <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </CardHeader>
        <p className="font-semibold text-white">{plan.location.name}</p>
        <p className="text-sm text-gray-400 mt-0.5">{plan.location.address}</p>
        {plan.logistics && (
          <div className="mt-3 p-3 bg-dark-bg rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Logistics</p>
            <p className="text-sm text-gray-300">{plan.logistics}</p>
          </div>
        )}
      </Card>

      {/* Itinerary */}
      <Card>
        <button
          onClick={() => setShowItinerary(!showItinerary)}
          className="w-full flex items-center justify-between"
        >
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-brand-cyan" />
            Itinerary ({plan.activities.length} stops)
          </CardTitle>
          {showItinerary ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showItinerary && (
          <div className="mt-4 space-y-3">
            {plan.activities.map((activity, i) => (
              <div key={i} className="flex gap-3">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-brand-purple/20 border border-brand-purple/40 flex items-center justify-center text-xs font-bold text-brand-purple-light flex-shrink-0">
                    {i + 1}
                  </div>
                  {i < plan.activities.length - 1 && (
                    <div className="w-px flex-1 bg-dark-border mt-1 mb-0" style={{ minHeight: '16px' }} />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs text-brand-purple-light font-mono">{activity.time}</span>
                      <p className="font-semibold text-white text-sm">{activity.activity}</p>
                      {activity.location && (
                        <p className="text-xs text-gray-500">{activity.location}</p>
                      )}
                      {activity.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">{activity.notes}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-solana-green font-semibold">
                        ~{formatUSD(activity.estimated_cost_usd)}
                      </p>
                      <p className="text-xs text-gray-600">{activity.duration_minutes}min</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Budget breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-solana-green" />
            Budget Breakdown
          </CardTitle>
        </CardHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Per person</span>
            <span className="text-xl font-bold text-solana-green">
              {formatUSD(plan.budget_breakdown.per_person_usd)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Group total ({plan.activities.length > 0 ? '~' : ''}{totalVoters || '?'} ppl)</span>
            <span className="text-gray-300">{formatUSD(plan.budget_breakdown.total_usd)}</span>
          </div>
          <div className="h-px bg-dark-border my-2" />
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Includes:</p>
            <div className="flex flex-wrap gap-1.5">
              {plan.budget_breakdown.includes.map(item => (
                <span key={item} className="text-xs px-2 py-0.5 bg-solana-green/10 text-solana-green rounded-lg">
                  {item}
                </span>
              ))}
            </div>
          </div>
          {plan.budget_breakdown.payment_note && (
            <p className="text-xs text-gray-500 mt-2 italic">{plan.budget_breakdown.payment_note}</p>
          )}
          <div className="bg-dark-bg rounded-xl p-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Your SOL deposit</span>
              <span className="text-sm font-bold text-solana-green">{formatSOL(depositAmountSol, 3)}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Returned if you show up ✓</p>
          </div>
        </div>
      </Card>

      {/* Approved banner */}
      {isApproved && (
        <Card variant="default" className="bg-emerald-500/10 border-emerald-500/30">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-emerald-400">Plan Approved! 🎉</p>
              <p className="text-xs text-gray-400">
                {approveCount}/{totalVoters} members approved — deposits are now open
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Voting */}
      {(onVote || totalVoters > 0) && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-cyan" />
              Squad Vote
            </CardTitle>
            <span className="text-sm text-gray-400">
              {approveCount}/{thresholdNeeded} needed ({thresholdPct}% threshold)
            </span>
          </CardHeader>

          {/* Progress bar with threshold marker */}
          <div className="relative mb-4">
            <Progress value={approvalPct} variant={isApproved ? 'solana' : 'gradient'} size="sm" />
            {/* Threshold marker */}
            {totalVoters > 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/40"
                style={{ left: `${thresholdPct}%` }}
              />
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4">
            {isApproved
              ? `✓ Threshold reached — plan locked in`
              : `Need ${thresholdNeeded - approveCount} more approval${thresholdNeeded - approveCount > 1 ? 's' : ''} to lock the plan`}
          </p>

          {onVote && !isApproved && (
            <>
              <p className="text-sm text-gray-400 mb-3">Does this plan work for you?</p>
              <div className="flex gap-3">
                <Button
                  variant={myVote === 'approve' ? 'primary' : 'secondary'}
                  className="flex-1"
                  onClick={() => onVote('approve')}
                  leftIcon={<ThumbsUp className="w-4 h-4" />}
                >
                  Looks good!
                </Button>
                <Button
                  variant={myVote === 'veto' ? 'danger' : 'secondary'}
                  className="flex-1"
                  onClick={() => onVote('veto')}
                  leftIcon={<ThumbsDown className="w-4 h-4" />}
                >
                  Not for me
                </Button>
              </div>
              {myVote === 'veto' && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Tell ShowUp AI what you'd prefer in the chat 👆
                </p>
              )}
            </>
          )}

          {onVote && isApproved && myVote !== 'approve' && (
            <p className="text-xs text-gray-500 text-center">Plan has been approved by the squad.</p>
          )}
        </Card>
      )}

      {/* Backup plan */}
      {plan.backup_plan && (
        <Card variant="default" padding="sm">
          <p className="text-xs text-gray-500 mb-1">Backup Plan 🌧️</p>
          <p className="text-sm text-gray-400">{plan.backup_plan}</p>
        </Card>
      )}

      {/* Alternatives */}
      {plan.alternatives?.length > 0 && (
        <div>
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center gap-2 text-sm text-brand-purple-light hover:text-brand-purple transition-colors w-full text-left"
          >
            {showAlternatives ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAlternatives ? 'Hide' : 'Show'} {plan.alternatives.length} alternative{plan.alternatives.length > 1 ? 's' : ''}
          </button>

          {showAlternatives && (
            <div className="mt-3 space-y-3">
              {plan.alternatives.map((alt, i) => (
                <Card key={i} variant="default" padding="sm">
                  <p className="font-semibold text-white text-sm">{alt.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{alt.summary}</p>
                  <p className="text-xs text-brand-purple-light mt-1.5">{alt.why_different}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
