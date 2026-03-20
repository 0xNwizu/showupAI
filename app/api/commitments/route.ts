import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateMockTxHash, generateMockSlot } from '@/lib/mock-solana/wallet'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId, txHash } = await req.json()

    if (!groupId) return NextResponse.json({ error: 'Group ID required' }, { status: 400 })

    // Use service client for all DB ops — RLS helper functions are unreliable in route handlers
    const serviceClient = createServiceClient()

    // Get user profile (auth_id lookup doesn't need RLS but keep consistent)
    const { data: profile } = await serviceClient
      .from('users').select('*').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Get group
    const { data: group } = await serviceClient
      .from('groups').select('*').eq('id', groupId).single()
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Check membership
    const { data: membership } = await serviceClient
      .from('group_members')
      .select('committed')
      .eq('group_id', groupId)
      .eq('user_id', profile.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Not a group member' }, { status: 403 })

    // Already committed — return existing data so the client can show success
    if (membership.committed) {
      const { data: existing } = await serviceClient
        .from('commitments').select('*').eq('group_id', groupId).eq('user_id', profile.id).single()
      return NextResponse.json({
        commitment: existing,
        newBalance: profile.mock_sol_balance,
        txHash: existing?.tx_hash_mock || '',
        alreadyCommitted: true,
      })
    }

    // Check balance
    const depositAmount = group.deposit_amount_sol
    if (profile.mock_sol_balance < depositAmount) {
      return NextResponse.json({ error: 'Insufficient SOL balance' }, { status: 400 })
    }

    const finalTxHash = txHash || generateMockTxHash()
    const mockSlot = generateMockSlot()
    const newBalance = profile.mock_sol_balance - depositAmount

    // Deduct from user balance
    await serviceClient
      .from('users')
      .update({ mock_sol_balance: newBalance })
      .eq('id', profile.id)

    // Create commitment record
    const { data: commitment, error: commitError } = await serviceClient
      .from('commitments')
      .insert({
        group_id: groupId,
        user_id: profile.id,
        amount_sol: depositAmount,
        status: 'locked',
        tx_hash_mock: finalTxHash,
        commitment_slot_mock: mockSlot,
      })
      .select()
      .single()

    if (commitError) return NextResponse.json({ error: commitError.message }, { status: 500 })

    // Post-commit updates — non-critical. If any fail the commitment is already saved.
    let committedCount = 0
    let totalCount = 0
    try {
      await serviceClient.from('mock_transactions').insert({
        user_id: profile.id,
        group_id: groupId,
        type: 'deposit',
        amount_sol: depositAmount,
        balance_after: newBalance,
        tx_hash: finalTxHash,
        status: 'confirmed',
        description: `Hangout deposit for "${group.name}"`,
        metadata: { group_name: group.name, slot: mockSlot },
      })

      await serviceClient
        .from('group_members')
        .update({
          committed: true,
          commitment_tx_mock: finalTxHash,
          committed_at: new Date().toISOString(),
        })
        .eq('group_id', groupId)
        .eq('user_id', profile.id)

      const { data: members } = await serviceClient
        .from('group_members')
        .select('committed')
        .eq('group_id', groupId)
        .eq('status', 'active')

      committedCount = members?.filter(m => m.committed).length || 0
      totalCount = members?.length || 0

      await serviceClient
        .from('groups')
        .update({
          total_committed: committedCount,
          status: committedCount === totalCount && totalCount > 0 ? 'committed' : 'committing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', groupId)
    } catch (postErr) {
      console.error('Post-commit update failed (commitment was saved):', postErr)
    }

    return NextResponse.json({
      commitment,
      newBalance,
      txHash: finalTxHash,
      committedCount,
      totalCount,
    })
  } catch (error) {
    console.error('Commitment error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
