import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GroupCard } from '@/components/groups/GroupCard'
import { JoinByCode } from '@/components/groups/JoinByCode'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Group, GroupMember } from '@/types'

export const metadata = { title: 'My Squads' }

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) redirect('/signup')

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('group:groups(*, members:group_members(*, user:users(*)))')
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups = ((memberRows || []) as any[]).map((r) => r.group).filter(Boolean) as Array<Group & { members: (GroupMember & { user: { display_name: string; avatar_url: string | null } })[] }>

  const activeGroups = groups.filter(g => !['completed', 'cancelled'].includes(g.status))
  const pastGroups = groups.filter(g => ['completed', 'cancelled'].includes(g.status))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">My Squads</h1>
          <p className="text-gray-400 mt-0.5">
            {activeGroups.length} active • {pastGroups.length} past
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <JoinByCode />
          <Link href="/groups/create">
            <Button variant="gradient" leftIcon={<Plus className="w-4 h-4" />}>
              New Squad
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Groups */}
      {activeGroups.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-bold text-white">Active</h2>
            <Badge variant="info" size="xs">{activeGroups.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGroups.map(group => {
              const myMembership = group.members?.find(m => m.user_id === profile.id)
              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  members={group.members as Parameters<typeof GroupCard>[0]['members']}
                  myMembership={myMembership}
                />
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-dark-border rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-brand-purple-light" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No squads yet</h3>
          <p className="text-gray-400 mb-6 max-w-xs mx-auto">
            Create your first squad and invite friends. AI will plan the perfect hangout.
          </p>
          <Link href="/groups/create">
            <Button variant="gradient" leftIcon={<Plus className="w-4 h-4" />}>
              Create Your First Squad
            </Button>
          </Link>
        </div>
      )}

      {/* Past Groups */}
      {pastGroups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-bold text-white">Past</h2>
            <Badge variant="default" size="xs">{pastGroups.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastGroups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                members={group.members as Parameters<typeof GroupCard>[0]['members']}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
