'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, CheckCheck, ArrowRight, Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { timeAgo } from '@/lib/utils'
import { toast } from 'sonner'

interface Nudge {
  id: string
  content: string
  type: string
  read: boolean
  created_at: string
  group_id: string
  group: { name: string; emoji: string } | null
}

export default function NudgesPage() {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [nudges, setNudges] = useState<Nudge[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await fetch('/api/nudges')
      if (res.ok) {
        const data = await res.json()
        setNudges(data.nudges || [])
      }
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const markAsRead = async (id: string) => {
    await fetch('/api/nudges', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nudgeId: id }),
    })
    setNudges(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = async () => {
    setMarkingAll(true)
    const res = await fetch('/api/nudges', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setMarkingAll(false)
    if (res.ok) {
      setNudges(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('All nudges marked as read')
    }
  }

  const unreadCount = nudges.filter(n => !n.read).length

  const NUDGE_TYPE_LABELS: Record<string, string> = {
    reminder: '🔔 Reminder',
    commitment_push: '💰 Commit up',
    event_reminder: '📅 Event soon',
    post_event: '🎉 Post-event',
    flake_warning: '⚠️ Flake warning',
    last_call: '🚨 Last call',
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-dark-card rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-pink" />
            Nudges
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            loading={markingAll}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Nudge list */}
      {nudges.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-dark-border rounded-3xl">
          <Inbox className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No nudges yet</h3>
          <p className="text-gray-500 text-sm">Your AI social coordinator will message you here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nudges.map(nudge => (
            <div
              key={nudge.id}
              className={`relative rounded-2xl border p-4 transition-all ${
                nudge.read
                  ? 'bg-dark-card border-dark-border opacity-70'
                  : 'bg-dark-card border-brand-purple/30 shadow-sm'
              }`}
            >
              {!nudge.read && (
                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-pink" />
              )}

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-lg flex-shrink-0">
                  {nudge.group?.emoji || '🤖'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {nudge.group && (
                      <span className="text-xs font-semibold text-brand-purple-light">
                        {nudge.group.name}
                      </span>
                    )}
                    <Badge variant="default" size="xs">
                      {NUDGE_TYPE_LABELS[nudge.type] || nudge.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{nudge.content}</p>
                  <p className="text-xs text-gray-600 mt-1.5">{timeAgo(nudge.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-border">
                {nudge.group_id && (
                  <Link href={`/groups/${nudge.group_id}`} className="flex-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => !nudge.read && markAsRead(nudge.id)}
                    >
                      Go to squad
                    </Button>
                  </Link>
                )}
                {!nudge.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(nudge.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
