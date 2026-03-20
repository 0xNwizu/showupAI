'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Group, GroupWithDetails } from '@/types'

export function useMyGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchGroups = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group:groups(
          *,
          creator:users!groups_created_by_fkey(id, username, display_name, avatar_url)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      const groupData = (data as unknown as Array<{ group: Group }>)
        .map(item => item.group)
        .filter(Boolean)
      setGroups(groupData)
    }
    setLoading(false)
  }, [userId, supabase])

  useEffect(() => {
    fetchGroups()

    // Subscribe to realtime updates
    if (!userId) return

    const channel = supabase
      .channel('my-groups')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_members',
        filter: `user_id=eq.${userId}`,
      }, fetchGroups)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchGroups, supabase, userId])

  return { groups, loading, error, refetch: fetchGroups }
}

export function useGroupDetails(groupId: string | undefined, userId: string | undefined) {
  const [group, setGroup] = useState<GroupWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchGroup = useCallback(async () => {
    if (!groupId || !userId) return
    setLoading(true)

    // Fetch group with members
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select(`
        *,
        creator:users!groups_created_by_fkey(*),
        members:group_members(
          *,
          user:users(*)
        )
      `)
      .eq('id', groupId)
      .single()

    if (groupError) {
      setError(groupError.message)
      setLoading(false)
      return
    }

    // Fetch my membership
    const { data: myMembership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    // Fetch my availability
    const { data: myAvailability } = await supabase
      .from('availability_responses')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    // Fetch my commitment
    const { data: myCommitment } = await supabase
      .from('commitments')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    // Fetch AI conversations
    const { data: conversations } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(50)

    // Fetch recent nudges for current user
    const { data: nudges } = await supabase
      .from('nudges')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    const activeMembers = (groupData.members as GroupWithDetails['members'])
      ?.filter(m => m.status === 'active') ?? []
    const committedMembers = activeMembers.filter(m => m.committed)

    const fullGroup: GroupWithDetails = {
      ...groupData,
      members: activeMembers,
      my_membership: myMembership ?? null,
      my_availability: myAvailability ?? null,
      my_commitment: myCommitment ?? null,
      conversations: conversations ?? [],
      recent_nudges: nudges ?? [],
      commitment_progress: {
        committed_count: committedMembers.length,
        total_count: activeMembers.length,
        percentage: activeMembers.length > 0
          ? Math.round((committedMembers.length / activeMembers.length) * 100)
          : 0,
        total_sol_locked: committedMembers.length * (groupData.deposit_amount_sol || 0.1),
        committed_members: committedMembers.map(m => m.user_id),
        uncommitted_members: activeMembers
          .filter(m => !m.committed)
          .map(m => m.user_id),
      },
    }

    setGroup(fullGroup)
    setLoading(false)
  }, [groupId, userId, supabase])

  useEffect(() => {
    fetchGroup()

    if (!groupId) return

    // Subscribe to realtime group updates
    const channel = supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'groups',
        filter: `id=eq.${groupId}`,
      }, fetchGroup)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_members',
        filter: `group_id=eq.${groupId}`,
      }, fetchGroup)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_conversations',
        filter: `group_id=eq.${groupId}`,
      }, fetchGroup)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchGroup, groupId, supabase])

  return { group, loading, error, refetch: fetchGroup }
}
