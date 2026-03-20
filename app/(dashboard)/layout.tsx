import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // Check session first
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch profile — distinguish between "no profile" and "DB error"
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 = "no rows returned" — any other error is a real DB problem
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Database not set up</h1>
          <p className="text-gray-400 text-sm mb-4">
            Run the schema SQL in your Supabase dashboard first.
          </p>
          <div className="bg-dark-card border border-dark-border rounded-xl p-4 text-left text-xs text-gray-500 font-mono">
            Supabase → SQL Editor → paste supabase/schema.sql → Run
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    // Don't redirect to /signup — that causes a loop if the user has a session but no profile.
    // Instead send them to /signup with a flag so the page knows to show the profile step.
    redirect('/signup?complete=1')
  }

  // Get unread nudge count (non-critical — ignore errors)
  const { count: unreadNudges } = await supabase
    .from('nudges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('read', false)

  return (
    <div className="min-h-screen">
      <Navbar user={profile} unreadNudges={unreadNudges || 0} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
