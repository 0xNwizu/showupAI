import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateMockTxHash } from '@/lib/mock-solana/wallet'

// POST /api/groups/[id]/resolve
// Admin-only: closes the event, forfeits no-shows' deposits, distributes to attendees
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()

    // Get user profile
    const { data: profile } = await serviceClient
      .from('users').select('id').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check caller is admin of this group
    const { data: membership } = await serviceClient
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', profile.id)
      .single()
    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Only the admin can close the event' }, { status: 403 })
    }

    // Get group
    const { data: group } = await serviceClient
      .from('groups').select('*').eq('id', groupId).single()
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    if (group.status === 'completed' || group.status === 'cancelled') {
      return NextResponse.json({ error: 'Event already resolved' }, { status: 400 })
    }

    // Get all active committed members
    const { data: members } = await serviceClient
      .from('group_members')
      .select('user_id, committed, checked_in')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .eq('committed', true)

    if (!members || members.length === 0) {
      // No committed members — just mark completed
      await serviceClient
        .from('groups')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', groupId)
      return NextResponse.json({ attendees: 0, noShows: 0, bonusPerAttendee: 0 })
    }

    const attendees = members.filter(m => m.checked_in)
    const noShows = members.filter(m => !m.checked_in)

    const depositAmount = group.deposit_amount_sol
    const totalForfeited = noShows.length * depositAmount
    // Bonus split equally among attendees (0 if no attendees to avoid division by zero)
    const bonusPerAttendee = attendees.length > 0 ? totalForfeited / attendees.length : 0

    const now = new Date().toISOString()

    // 1. Mark no-shows as forfeited
    if (noShows.length > 0) {
      const noShowIds = noShows.map(m => m.user_id)
      await serviceClient
        .from('commitments')
        .update({ status: 'forfeited', resolved_at: now, resolution_note: 'Did not check in' })
        .eq('group_id', groupId)
        .in('user_id', noShowIds)
    }

    // 2. Distribute bonus to each attendee
    for (const attendee of attendees) {
      if (bonusPerAttendee <= 0) break

      // Get current balance
      const { data: attendeeUser } = await serviceClient
        .from('users').select('mock_sol_balance').eq('id', attendee.user_id).single()
      if (!attendeeUser) continue

      const newBalance = attendeeUser.mock_sol_balance + bonusPerAttendee
      const txHash = generateMockTxHash()

      await serviceClient
        .from('users')
        .update({ mock_sol_balance: newBalance })
        .eq('id', attendee.user_id)

      await serviceClient.from('mock_transactions').insert({
        user_id: attendee.user_id,
        group_id: groupId,
        type: 'reward',
        amount_sol: bonusPerAttendee,
        balance_after: newBalance,
        tx_hash: txHash,
        status: 'confirmed',
        description: `Bonus from no-shows in "${group.name}" — you showed up! 🏆`,
        metadata: { no_show_count: noShows.length, attendee_count: attendees.length },
      })
    }

    // 3. Mark group as completed
    await serviceClient
      .from('groups')
      .update({ status: 'completed', updated_at: now })
      .eq('id', groupId)

    return NextResponse.json({
      attendees: attendees.length,
      noShows: noShows.length,
      bonusPerAttendee: Math.round(bonusPerAttendee * 1000) / 1000,
      totalForfeited: Math.round(totalForfeited * 1000) / 1000,
    })
  } catch (error) {
    console.error('Resolve error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
