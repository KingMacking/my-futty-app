import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import type { Profile } from '../types'

async function upsertProfile(id: string, email: string) {
  await supabase.from('profiles').upsert({ id, email }, { onConflict: 'id' })
}

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean       // auth loading
  profileLoading: boolean
  init: () => () => void
  loadProfile: (userId: string) => Promise<void>
  saveProfile: (userId: string, data: { username: string; full_name: string }) => Promise<boolean>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: true,
  profileLoading: false,

  init: () => {
    // getSession resuelve el estado inicial de auth — loading pasa a false aquí siempre
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, loading: false })
      if (session) {
        set({ profileLoading: true })
        upsertProfile(session.user.id, session.user.email ?? '').then(async () => {
          const { data } = await supabase
            .from('profiles').select('*').eq('id', session.user.id).single()
          set({ profile: data as Profile ?? null, profileLoading: false })
        }).catch(() => set({ profileLoading: false }))
      }
    }).catch(() => set({ loading: false }))

    // onAuthStateChange para login/logout después del init
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session })
      if (session) {
        set({ profileLoading: true })
        upsertProfile(session.user.id, session.user.email ?? '').then(async () => {
          const { data } = await supabase
            .from('profiles').select('*').eq('id', session.user.id).single()
          set({ profile: data as Profile ?? null, profileLoading: false })
        }).catch(() => set({ profileLoading: false }))
      } else {
        set({ profile: null, profileLoading: false })
      }
    })

    return () => subscription.unsubscribe()
  },

  loadProfile: async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) set({ profile: data as Profile })
  },

  saveProfile: async (userId, { username, full_name }) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .neq('id', userId)
      .maybeSingle()

    if (existing) return false

    const { data, error } = await supabase
      .from('profiles')
      .update({ username: username.trim(), full_name: full_name.trim() })
      .eq('id', userId)
      .select()
      .single()

    if (error || !data) return false
    set({ profile: data as Profile })
    return true
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ profile: null })
  },
}))
