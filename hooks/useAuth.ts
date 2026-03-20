'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  const supabase = createClient()

  const fetchUser = useCallback(async (authId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .single()

    if (error) {
      setState(prev => ({ ...prev, error: error.message, loading: false }))
      return
    }

    setState({ user: data as User, loading: false, error: null })
  }, [supabase])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUser(session.user.id)
      } else {
        setState({ user: null, loading: false, error: null })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser(session.user.id)
      } else {
        setState({ user: null, loading: false, error: null })
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUser, supabase.auth])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase.auth])

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await fetchUser(session.user.id)
    }
  }, [fetchUser, supabase.auth])

  return {
    ...state,
    signOut,
    refreshUser,
  }
}
