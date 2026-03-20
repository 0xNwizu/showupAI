import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/nudges - Get user's nudges
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('id').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const serviceClient = createServiceClient()
    const { data: nudges } = await serviceClient
      .from('nudges')
      .select('*, group:groups(name, emoji)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30)

    return NextResponse.json({ nudges: nudges || [] })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/nudges - Mark nudges as read
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('id').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { nudgeId, markAll } = await req.json()
    const serviceClient = createServiceClient()

    if (markAll) {
      await serviceClient.from('nudges')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', profile.id)
        .eq('read', false)
    } else if (nudgeId) {
      await serviceClient.from('nudges')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', nudgeId)
        .eq('user_id', profile.id)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
