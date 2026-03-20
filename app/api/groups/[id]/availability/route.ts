import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { AvailabilityFormData } from '@/types'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('id').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body: AvailabilityFormData = await req.json()

    // Use service client for writes to bypass RLS
    const serviceClient = createServiceClient()

    // Upsert availability
    const { data, error } = await serviceClient
      .from('availability_responses')
      .upsert({
        group_id: groupId,
        user_id: profile.id,
        available_dates: body.available_dates,
        budget_range: body.budget_range,
        budget_amount_usd: body.budget_amount_usd || null,
        vibe_preferences: body.vibe_preferences,
        dietary_restrictions: body.dietary_restrictions || '',
        transport: body.transport || 'any',
        max_travel_time: body.max_travel_time || 30,
        notes: body.notes || '',
        location: body.location || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'group_id,user_id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Mark member as having submitted availability
    await serviceClient
      .from('group_members')
      .update({ availability_submitted: true })
      .eq('group_id', groupId)
      .eq('user_id', profile.id)

    // Check if all members have submitted - update group status
    const { data: members } = await serviceClient
      .from('group_members')
      .select('availability_submitted')
      .eq('group_id', groupId)
      .eq('status', 'active')

    const allSubmitted = members?.every(m => m.availability_submitted)
    if (allSubmitted && members && members.length > 1) {
      await serviceClient
        .from('groups')
        .update({ status: 'collecting_availability', updated_at: new Date().toISOString() })
        .eq('id', groupId)
        .eq('status', 'planning')
    }

    return NextResponse.json({ availability: data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
