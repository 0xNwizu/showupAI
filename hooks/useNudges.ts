'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Nudge } from '@/types'

export function useNudges(userId: string | undefined) {
  const [nudges, setNudges] = useState<Nudge[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchNudges = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('nudges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNudges(data as Nudge[])
      setUnreadCount(data.filter(n => !n.read).length)
    }
    setLoading(false)
  }, [userId, supabase])

  const markAsRead = useCallback(async (nudgeId: string) => {
    await supabase
      .from('nudges')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', nudgeId)

    setNudges(prev => prev.map(n => n.id === nudgeId ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [supabase])

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    await supabase
      .from('nudges')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false)

    setNudges(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [userId, supabase])

  useEffect(() => {
    fetchNudges()

    if (!userId) return

    const channel = supabase
      .channel(`nudges-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'nudges',
        filter: `user_id=eq.${userId}`,
      }, () => fetchNudges())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchNudges, supabase, userId])

  return { nudges, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNudges }
}
