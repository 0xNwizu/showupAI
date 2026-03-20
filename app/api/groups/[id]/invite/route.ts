import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/groups/[id]/invite - Join via invite code (from join page)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { inviteCode } = await req.json()

    const { data: group } = await supabase
      .from('groups')
      .select('id, invite_code, max_members, total_members, status')
      .eq('id', groupId)
      .single()

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    if (inviteCode && group.invite_code !== inviteCode) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 })
    }

    const { data: profile } = await supabase
      .from('users').select('id').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check existing membership
    const { data: existing } = await supabase
      .from('group_members')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', profile.id)
      .single()

    if (existing?.status === 'active') {
      return NextResponse.json({ message: 'Already a member', alreadyMember: true })
    }

    if (group.total_members >= group.max_members) {
      return NextResponse.json({ error: 'Group is full' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    if (existing) {
      await serviceClient.from('group_members')
        .update({ status: 'active' }).eq('id', existing.id)
    } else {
      await serviceClient.from('group_members').insert({
        group_id: groupId,
        user_id: profile.id,
        role: 'member',
        status: 'active',
      })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
