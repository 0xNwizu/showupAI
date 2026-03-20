import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/join?code=xxx — public endpoint to preview a group by invite code
// Uses service client so non-members can see the group details before joining
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const serviceClient = createServiceClient()
  const { data: group, error } = await serviceClient
    .from('groups')
    .select('id, name, emoji, description, deposit_amount_sol, total_members, max_members, status, members:group_members(user:users(display_name, avatar_url))')
    .eq('invite_code', code.toLowerCase())
    .single()

  if (error || !group) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

  return NextResponse.json({ group })
}
