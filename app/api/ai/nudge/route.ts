import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateBatchNudges } from '@/lib/anthropic/nudger'
import type { Group, User, NudgeType } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId, nudgeType, userIds }: {
      groupId: string
      nudgeType: NudgeType
      userIds?: string[]  // specific users, or all uncommitted if not specified
    } = await req.json()

    if (!groupId || !nudgeType) {
      return NextResponse.json({ error: 'Group ID and nudge type required' }, { status: 400 })
    }

    // Get user profile (must be admin)
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', profile.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fetch group
    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Determine target users
    let targetUserIds = userIds
    if (!targetUserIds || targetUserIds.length === 0) {
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, committed')
        .eq('group_id', groupId)
        .eq('status', 'active')

      const committedCount = members?.filter(m => m.committed).length || 0
      const totalCount = members?.length || 0

      targetUserIds = (members || [])
        .filter(m => nudgeType === 'commitment_push' ? !m.committed : true)
        .map(m => m.user_id)
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ message: 'No users to nudge', count: 0 })
    }

    // Fetch target user details
    const { data: targetUsers } = await supabase
      .from('users')
      .select('*')
      .in('id', targetUserIds)

    if (!targetUsers || targetUsers.length === 0) {
      return NextResponse.json({ message: 'No users found', count: 0 })
    }

    // Get commitment stats for context
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id, committed')
      .eq('group_id', groupId)
      .eq('status', 'active')

    const committedCount = members?.filter(m => m.committed).length || 0
    const totalCount = members?.length || 0

    // Generate nudges
    const contexts = targetUsers.map(u => ({
      group: group as Group,
      targetUser: u as User,
      nudgeType,
      additionalContext: {
        committed_count: committedCount,
        total_count: totalCount,
      },
    }))

    const nudges = await generateBatchNudges(contexts)

    // Save nudges to DB — use service role to bypass RLS for system-generated nudges
    const serviceClient = createServiceClient()
    const nudgeRecords = nudges.map(n => ({
      group_id: groupId,
      user_id: n.userId,
      content: n.message,
      type: nudgeType,
      sent_by: 'ai',
    }))

    await serviceClient.from('nudges').insert(nudgeRecords)

    return NextResponse.json({ count: nudges.length, nudges })
  } catch (error) {
    console.error('Nudge error:', error)
    return NextResponse.json({ error: 'Nudge generation failed' }, { status: 500 })
  }
}
