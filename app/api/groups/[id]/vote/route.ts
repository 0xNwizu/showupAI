import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { MemberVote } from '@/types'

// POST /api/groups/[id]/vote
// Body: { vote: 'approve' | 'veto' }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { vote } = await req.json()
    if (!['approve', 'veto'].includes(vote)) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: profile } = await serviceClient
      .from('users').select('id').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Get group with plan
    const { data: group } = await serviceClient
      .from('groups').select('*').eq('id', groupId).single()
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    if (!group.ai_plan) return NextResponse.json({ error: 'No plan to vote on' }, { status: 400 })
    if (group.status === 'completed' || group.status === 'cancelled') {
      return NextResponse.json({ error: 'Event already closed' }, { status: 400 })
    }

    // Check membership
    const { data: membership } = await serviceClient
      .from('group_members').select('role').eq('group_id', groupId).eq('user_id', profile.id).single()
    if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

    // Update votes in the plan JSONB
    const plan = group.ai_plan as { member_votes?: MemberVote[]; [key: string]: unknown }
    const existingVotes: MemberVote[] = plan.member_votes || []
    const filtered = existingVotes.filter(v => v.user_id !== profile.id)
    const newVote: MemberVote = { user_id: profile.id, vote, voted_at: new Date().toISOString() }
    const updatedVotes = [...filtered, newVote]

    const updatedPlan = { ...plan, member_votes: updatedVotes }

    // Count votes
    const approveCount = updatedVotes.filter(v => v.vote === 'approve').length
    const vetoCount = updatedVotes.filter(v => v.vote === 'veto').length

    // Get total active member count for threshold
    const { data: activeMembers } = await serviceClient
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('status', 'active')

    const totalMembers = activeMembers?.length || 0
    const thresholdNeeded = Math.ceil(totalMembers * 0.75)
    const approved = approveCount >= thresholdNeeded

    // Save updated plan
    await serviceClient
      .from('groups')
      .update({
        ai_plan: updatedPlan,
        updated_at: new Date().toISOString(),
        // If approved, advance to committing and lock in the plan date/location
        ...(approved && group.status !== 'committing' && group.status !== 'committed' && group.status !== 'active'
          ? {
              status: 'committing',
              event_date: plan.date && plan.date !== 'TBD' ? plan.date : group.event_date,
              event_location: (plan.location as { name?: string } | null)?.name || group.event_location,
            }
          : {}),
      })
      .eq('id', groupId)

    return NextResponse.json({
      myVote: vote,
      approveCount,
      vetoCount,
      totalVoters: totalMembers,
      thresholdNeeded,
      approved,
    })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
