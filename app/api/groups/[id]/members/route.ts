import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: members, error } = await supabase
      .from('group_members')
      .select('*, user:users(*)')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ members })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
