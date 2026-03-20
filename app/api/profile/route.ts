import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateMockSolanaAddress, generateMockTxHash } from '@/lib/mock-solana/wallet'
import { generateAvatarUrl } from '@/lib/utils'

// POST /api/profile - Create user profile after signup
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { username, display_name, bio } = await req.json()

    if (!username || !display_name) {
      return NextResponse.json({ error: 'Username and display name required' }, { status: 400 })
    }

    // Check username uniqueness
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const mockWalletAddress = generateMockSolanaAddress()
    const avatarUrl = generateAvatarUrl(username)

    // Use service client for writes — profile doesn't exist yet so RLS can't verify identity
    const serviceClient = createServiceClient()

    // Create user profile with initial 10 SOL airdrop
    const { data: profile, error } = await serviceClient
      .from('users')
      .insert({
        auth_id: user.id,
        username: username.toLowerCase(),
        display_name,
        bio: bio || '',
        avatar_url: avatarUrl,
        mock_wallet_address: mockWalletAddress,
        mock_sol_balance: 10.0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Log initial airdrop
    await serviceClient.from('mock_transactions').insert({
      user_id: profile.id,
      type: 'initial_airdrop',
      amount_sol: 10.0,
      balance_after: 10.0,
      tx_hash: generateMockTxHash(),
      status: 'confirmed',
      description: 'Welcome to ShowUp AI! Here\'s your 10 SOL to get started 🎉',
    })

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error('Profile creation error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/profile - Update user profile
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { display_name, bio, avatar_url } = body

    const { data: profile, error } = await supabase
      .from('users')
      .update({
        ...(display_name && { display_name }),
        ...(bio !== undefined && { bio }),
        ...(avatar_url && { avatar_url }),
        updated_at: new Date().toISOString(),
      })
      .eq('auth_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
