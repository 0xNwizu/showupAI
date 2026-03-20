import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from './ProfileClient'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('*').eq('auth_id', user.id).single()
  if (!profile) redirect('/signup')

  const { data: transactions } = await supabase
    .from('mock_transactions')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: rawGroupMemberships } = await supabase
    .from('group_members')
    .select('group:groups(name, emoji, status, event_date), committed, checked_in')
    .eq('user_id', profile.id)
    .eq('status', 'active')

  type GroupMembershipRow = { group: { name: string; emoji: string; status: string; event_date: string | null }; committed: boolean; checked_in: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupMemberships = ((rawGroupMemberships || []) as any[]) as GroupMembershipRow[]

  return <ProfileClient profile={profile} transactions={transactions || []} groupMemberships={groupMemberships} />
}
