import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateMockSolanaAddress } from '@/lib/mock-solana/wallet'
import type { CreateGroupFormData } from '@/types'

// GET /api/groups - Get user's groups
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: groups, error } = await supabase
      .from('group_members')
      .select('group:groups(*, creator:users!groups_created_by_fkey(id, username, display_name, avatar_url))')
      .eq('user_id', profile.id)
      .eq('status', 'active')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ groups: (groups || []).map((g: { group: unknown }) => g.group) })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/groups - Create a group
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body: CreateGroupFormData = await req.json()
    const { name, description, emoji, deposit_amount_sol, max_members, event_type } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Group name required' }, { status: 400 })
    }

    // Use service client for writes to bypass RLS
    const serviceClient = createServiceClient()

    // Create group
    const { data: group, error: groupError } = await serviceClient
      .from('groups')
      .insert({
        name: name.trim(),
        description: description?.trim() || '',
        emoji: emoji || '🎉',
        created_by: profile.id,
        status: 'planning',
        deposit_amount_sol: deposit_amount_sol || 0.1,
        max_members: max_members || 20,
        event_type: event_type || null,
      })
      .select()
      .single()

    if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 })

    // Add creator as admin member
    await serviceClient.from('group_members').insert({
      group_id: group.id,
      user_id: profile.id,
      role: 'admin',
      status: 'active',
    })

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    console.error('Create group error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
