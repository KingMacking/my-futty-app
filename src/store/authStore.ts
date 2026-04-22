import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
  init: () => () => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,

  init: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, loading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session })
    })

    return () => subscription.unsubscribe()
  },

  signOut: () => supabase.auth.signOut(),
}))
