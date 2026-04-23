import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

async function upsertProfile(id: string, email: string) {
  await supabase.from('profiles').upsert({ id, email }, { onConflict: 'id' })
}

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
      if (session) upsertProfile(session.user.id, session.user.email ?? '')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session })
      if (session) upsertProfile(session.user.id, session.user.email ?? '')
    })

    return () => subscription.unsubscribe()
  },

  signOut: () => supabase.auth.signOut(),
}))
