'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { formatSOL } from '@/lib/utils'
import { EVENT_TYPE_OPTIONS } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { EventType } from '@/types'

const EMOJIS = ['🎉', '🍕', '🍺', '🎬', '🏔️', '🌊', '🎮', '☕', '🎵', '🏋️', '🎭', '✈️', '🌙', '🔥', '💫']

const DEPOSIT_PRESETS = [0.05, 0.1, 0.25, 0.5, 1.0]

export default function CreateGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [eventType, setEventType] = useState<EventType | ''>('')
  const [depositSol, setDepositSol] = useState(0.1)
  const [maxMembers, setMaxMembers] = useState(10)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Give your squad a name!'); return }

    setLoading(true)
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        emoji,
        deposit_amount_sol: depositSol,
        max_members: maxMembers,
        event_type: eventType || null,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error('Failed to create group', { description: data.error })
      return
    }

    toast.success(`${emoji} ${name} created!`)
    router.push(`/groups/${data.group.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/groups">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">Create a Squad</h1>
          <p className="text-gray-400 text-sm">Set up your hangout group and invite friends</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Squad Details</CardTitle>
          </CardHeader>

          {/* Emoji picker */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-300 mb-2">Pick a vibe emoji</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all',
                    emoji === e
                      ? 'bg-brand-purple/20 border-2 border-brand-purple scale-110'
                      : 'bg-dark-bg border border-dark-border hover:border-dark-border-light'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Squad Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tech Crew, Friday Night Gang, The Usual Suspects..."
              required
              maxLength={50}
              hint={`${name.length}/50`}
            />

            <Textarea
              label="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's this squad about? Any recurring hangout style?"
              rows={2}
            />
          </div>
        </Card>

        {/* Event Type */}
        <Card>
          <CardHeader>
            <CardTitle>What kind of hangout?</CardTitle>
          </CardHeader>
          <p className="text-sm text-gray-400 mb-3">Helps AI make better suggestions (can change later)</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {EVENT_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEventType(eventType === opt.value ? '' : opt.value)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-xs',
                  eventType === opt.value
                    ? 'border-brand-purple bg-brand-purple/20 text-white'
                    : 'border-dark-border text-gray-400 hover:border-dark-border-light'
                )}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-center leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Commitment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Commitment Deposit
              <span className="text-xs text-gray-500 font-normal">(mock SOL)</span>
            </CardTitle>
          </CardHeader>
          <p className="text-sm text-gray-400 mb-4">
            Everyone in the squad locks this amount. Show up → get it back. Flake → lose it to those who came.
          </p>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {DEPOSIT_PRESETS.map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => setDepositSol(amount)}
                className={cn(
                  'px-4 py-2 rounded-xl border text-sm font-mono font-semibold transition-all',
                  depositSol === amount
                    ? 'border-solana-green bg-solana-green/10 text-solana-green'
                    : 'border-dark-border text-gray-400 hover:border-dark-border-light'
                )}
              >
                ◎ {amount}
              </button>
            ))}
          </div>

          <div className="bg-dark-bg rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Deposit amount</p>
                <p className="text-2xl font-black text-solana-green font-mono">◎ {depositSol.toFixed(3)}</p>
                <p className="text-xs text-gray-600 mt-0.5">≈ ${(depositSol * 150).toFixed(2)} USD</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">For {maxMembers} members</p>
                <p className="text-sm font-bold text-gray-300">
                  Total pool: ◎ {(depositSol * maxMembers).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Max members */}
        <Card>
          <CardHeader>
            <CardTitle>Crew Size</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {[4, 6, 8, 10, 15, 20].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMaxMembers(n)}
                  className={cn(
                    'w-12 h-12 rounded-xl border text-sm font-bold transition-all',
                    maxMembers === n
                      ? 'border-brand-purple bg-brand-purple/20 text-white'
                      : 'border-dark-border text-gray-400 hover:border-dark-border-light'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-400">max members</span>
          </div>
        </Card>

        {/* Summary */}
        <Card variant="gradient" className="border-brand-purple/30">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-brand-purple-light" />
            <span className="font-semibold text-white">Squad Summary</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{emoji}</span>
              <span className="text-white font-medium">{name || 'Your Squad Name'}</span>
            </div>
            {eventType && (
              <p className="text-gray-400">
                Type: {EVENT_TYPE_OPTIONS.find(o => o.value === eventType)?.label}
              </p>
            )}
            <p className="text-gray-400">Up to {maxMembers} members</p>
            <p className="text-solana-green">◎ {depositSol.toFixed(3)} SOL deposit per person</p>
          </div>
        </Card>

        <Button
          type="submit"
          variant="gradient"
          size="xl"
          loading={loading}
          className="w-full"
          leftIcon={<Sparkles className="w-5 h-5" />}
        >
          Create Squad
        </Button>
      </form>
    </div>
  )
}
