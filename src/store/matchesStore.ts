import { create } from 'zustand'
import { toast } from 'sonner'
import { supabase } from '../services/supabase'
import type { Match, MatchResult } from '../types'

interface MatchesState {
  matches: Match[]
  loading: boolean
  submitting: boolean
  fetch: (userId: string) => Promise<void>
  addMatch: (userId: string, result: MatchResult, countsForWorldcup: boolean) => Promise<boolean>
}

export const useMatchesStore = create<MatchesState>((set, get) => ({
  matches: [],
  loading: false,
  submitting: false,

  fetch: async (userId: string) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Error cargando partidos')
    } else {
      set({ matches: data as Match[] })
    }
    set({ loading: false })
  },

  addMatch: async (userId, result, countsForWorldcup) => {
    set({ submitting: true })
    const { data, error } = await supabase
      .from('matches')
      .insert({ user_id: userId, result, counts_for_worldcup: countsForWorldcup })
      .select()
      .single()

    if (error) {
      toast.error('Error guardando el partido')
      set({ submitting: false })
      return false
    }

    const match = data as Match
    set({ matches: [match, ...get().matches], submitting: false })
    toast.success('Partido registrado')

    if (countsForWorldcup) {
      // Importación lazy para evitar dependencia circular
      const { useWorldcupStore } = await import('./worldcupStore')
      const wc = useWorldcupStore.getState()

      // Crear nuevo mundial si no hay uno activo
      if (!wc.worldcup || wc.worldcup.status !== 'active') {
        await wc.createNew(userId)
      }

      await useWorldcupStore.getState().applyMatchResult(match.id, result)
    }

    return true
  },
}))
