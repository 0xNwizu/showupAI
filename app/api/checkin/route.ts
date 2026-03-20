import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateMockTxHash } from '@/lib/mock-solana/wallet'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId, lat, lng } = await req.json()
    if (!groupId) return NextResponse.json({ error: 'Group ID required' }, { status: 400 })

    const { data: profile } = await supabase
      .from('users').select('*').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check membership and commitment
    const { data: membership } = await supabase
      .from('group_members')
      .select('committed, checked_in')
      .eq('group_id', groupId)
      .eq('user_id', profile.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    if (!membership.committed) return NextResponse.json({ error: 'Must commit first' }, { status: 400 })
    if (membership.checked_in) return NextResponse.json({ error: 'Already checked in' }, { status: 400 })

    // Get group details
    const { data: group } = await supabase
      .from('groups').select('*').eq('id', groupId).single()
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Use service client for all writes to bypass RLS
    const serviceClient = createServiceClient()

    // Record check-in
    await serviceClient.from('checkins').insert({
      group_id: groupId,
      user_id: profile.id,
      lat: lat || null,
      lng: lng || null,
      verification_method: lat && lng ? 'location' : 'manual',
      verified: true,
    })

    // Update member status
    await serviceClient
      .from('group_members')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq('group_id', groupId)
      .eq('user_id', profile.id)

    // Return deposit to user
    const returnTxHash = generateMockTxHash()
    const returnAmount = group.deposit_amount_sol
    const newBalance = profile.mock_sol_balance + returnAmount

    await serviceClient
      .from('users')
      .update({ mock_sol_balance: newBalance, hangouts_attended: profile.hangouts_attended + 1 })
      .eq('id', profile.id)

    await serviceClient
      .from('commitments')
      .update({ status: 'returned', resolved_at: new Date().toISOString(), resolution_note: 'Showed up!' })
      .eq('group_id', groupId)
      .eq('user_id', profile.id)

    await serviceClient.from('mock_transactions').insert({
      user_id: profile.id,
      group_id: groupId,
      type: 'return',
      amount_sol: returnAmount,
      balance_after: newBalance,
      tx_hash: returnTxHash,
      status: 'confirmed',
      description: `Deposit returned — you showed up to "${group.name}"! 🎉`,
    })

    // Check if everyone has checked in - close the group
    const { data: allMembers } = await serviceClient
      .from('group_members')
      .select('committed, checked_in')
      .eq('group_id', groupId)
      .eq('status', 'active')

    const committedMembers = allMembers?.filter(m => m.committed) || []
    const checkedInCount = committedMembers.filter(m => m.checked_in).length + 1 // +1 for current

    if (checkedInCount === committedMembers.length) {
      await serviceClient
        .from('groups')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', groupId)
    } else {
      await serviceClient
        .from('groups')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', groupId)
        .eq('status', 'committed')
    }

    return NextResponse.json({
      success: true,
      returnedAmount: returnAmount,
      newBalance,
      txHash: returnTxHash,
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
