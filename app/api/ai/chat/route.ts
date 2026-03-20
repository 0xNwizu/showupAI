import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithPlanner } from '@/lib/anthropic/planner'
import type { AIPlan } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId, message } = await req.json()

    if (!groupId || !message) {
      return NextResponse.json({ error: 'Group ID and message required' }, { status: 400 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Verify membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', profile.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Not a group member' }, { status: 403 })

    // Fetch group + current plan
    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    // Fetch conversation history (last 20 messages)
    const { data: history } = await supabase
      .from('ai_conversations')
      .select('role, content')
      .eq('group_id', groupId)
      .eq('message_type', 'chat')
      .order('created_at', { ascending: false })
      .limit(20)

    const messages = (history || []).reverse()

    // Save user message
    await supabase.from('ai_conversations').insert({
      group_id: groupId,
      user_id: profile.id,
      role: 'user',
      content: message,
      message_type: 'chat',
    })

    // Build group context
    const groupContext = `
Group: ${group?.name} (${group?.description})
Status: ${group?.status}
Members: ${group?.total_members}
Deposit: ◎${group?.deposit_amount_sol} SOL per person
`

    // Get AI response
    const aiResponse = await chatWithPlanner(
      groupContext,
      [...messages, { role: 'user', content: message }].map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      group?.ai_plan as AIPlan | undefined
    )

    // Save AI response
    await supabase.from('ai_conversations').insert({
      group_id: groupId,
      user_id: null,
      role: 'assistant',
      content: aiResponse,
      message_type: 'chat',
    })

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Chat failed' },
      { status: 500 }
    )
  }
}
