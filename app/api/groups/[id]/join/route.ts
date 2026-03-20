import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('id').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', profile.id)
      .single()

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ message: 'Already a member' })
      }
      // Re-join using service client
      const serviceClient = createServiceClient()
      await serviceClient
        .from('group_members')
        .update({ status: 'active', joined_at: new Date().toISOString() })
        .eq('id', existing.id)
      return NextResponse.json({ message: 'Rejoined group' })
    }

    // Use service client for the group read — the user isn't a member yet so RLS blocks the anon client
    const serviceClient = createServiceClient()

    const { data: group } = await serviceClient
      .from('groups')
      .select('max_members, total_members, status')
      .eq('id', groupId)
      .single()

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    if (group.status === 'cancelled' || group.status === 'completed') {
      return NextResponse.json({ error: 'This group is no longer accepting members' }, { status: 400 })
    }

    if (group.total_members >= group.max_members) {
      return NextResponse.json({ error: 'Group is full' }, { status: 400 })
    }
    const { error } = await serviceClient.from('group_members').insert({
      group_id: groupId,
      user_id: profile.id,
      role: 'member',
      status: 'active',
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: 'Joined group successfully' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
