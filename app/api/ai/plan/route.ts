import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateHangoutPlan } from '@/lib/anthropic/planner'
import type { Group, GroupMemberWithUser, AvailabilityResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { groupId, additionalContext } = await req.json()

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID required' }, { status: 400 })
    }

    // Verify user is member of this group
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

    if (!membership) {
      return NextResponse.json({ error: 'Not a group member' }, { status: 403 })
    }

    // Use service client for all DB writes — RLS update policy requires admin role
    // which may not resolve correctly in route handler context
    const serviceClient = createServiceClient()

    // Fetch group data
    const { data: group, error: groupError } = await serviceClient
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (groupError || !group) return NextResponse.json({ error: groupError?.message || 'Group not found' }, { status: 500 })

    // Fetch members
    const { data: members } = await serviceClient
      .from('group_members')
      .select('*, user:users(*)')
      .eq('group_id', groupId)
      .eq('status', 'active')

    // Fetch availability responses
    const { data: availabilityResponses } = await serviceClient
      .from('availability_responses')
      .select('*')
      .eq('group_id', groupId)

    // Update group status to ai_planning
    await serviceClient
      .from('groups')
      .update({ status: 'ai_planning', updated_at: new Date().toISOString() })
      .eq('id', groupId)

    // Generate plan
    const plan = await generateHangoutPlan({
      group: group as Group,
      members: (members || []) as GroupMemberWithUser[],
      availabilityResponses: (availabilityResponses || []) as AvailabilityResponse[],
      additionalContext,
    })

    // Save plan to group
    await serviceClient
      .from('groups')
      .update({
        ai_plan: plan,
        ai_plan_summary: plan.summary,
        status: 'plan_ready',
        event_date: plan.date !== 'TBD' ? new Date(plan.date + 'T' + (plan.time || '18:00')).toISOString() : null,
        event_location: plan.location?.name ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)

    // Log AI message
    await serviceClient.from('ai_conversations').insert({
      group_id: groupId,
      user_id: null,
      role: 'assistant',
      content: `I've created a plan for ${group.name}! Here's what I came up with: "${plan.title}". ${plan.summary}`,
      message_type: 'plan_generation',
      metadata: { plan },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Plan generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Plan generation failed' },
      { status: 500 }
    )
  }
}
