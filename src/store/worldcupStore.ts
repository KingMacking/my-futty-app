import { create } from 'zustand'
import { toast } from 'sonner'
import { supabase } from '../services/supabase'
import { calcTransition, buildWorldcupUpdate, getNextStage } from '../services/worldcupLogic'
import type { Worldcup, MatchResult } from '../types'

interface WorldcupState {
  worldcup: Worldcup | null
  loading: boolean
  pendingCoinFlip: boolean
  fetch: (userId: string) => Promise<void>
  createNew: (userId: string) => Promise<void>
  applyMatchResult: (matchId: string, result: MatchResult) => Promise<void>
  resolveCoinFlip: (won: boolean) => Promise<void>
  reset: () => void
}

export const useWorldcupStore = create<WorldcupState>((set, get) => ({
  worldcup: null,
  loading: false,
  pendingCoinFlip: false,

  fetch: async (userId: string) => {
    set({ loading: true })

    // Buscar mundial activo
    const { data: active, error } = await supabase
      .from('worldcups')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      toast.error('Error cargando el mundial')
      set({ loading: false })
      return
    }

    if (active) {
      set({ worldcup: active as Worldcup, loading: false })
      return
    }

    // Sin mundial activo: cargar el más reciente para mostrar el estado anterior
    const { data: last } = await supabase
      .from('worldcups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    set({ worldcup: (last as Worldcup) ?? null, loading: false })
  },

  createNew: async (userId: string) => {
    const { data, error } = await supabase
      .from('worldcups')
      .insert({ user_id: userId })
      .select()
      .single()

    if (error) {
      toast.error('Error creando el mundial')
    } else {
      set({ worldcup: data as Worldcup })
    }
  },

  applyMatchResult: async (matchId: string, result: MatchResult) => {
    const { worldcup } = get()
    if (!worldcup || worldcup.status !== 'active') return

    const transition = calcTransition(worldcup, result)
    let update = buildWorldcupUpdate(worldcup, result, transition)

    // Registrar en worldcup_matches
    await supabase.from('worldcup_matches').insert({
      worldcup_id: worldcup.id,
      match_id: matchId,
      stage: worldcup.current_stage,
    })

    if (transition.type === 'coin_flip') {
      // Actualizar stats sin cambiar estado — el modal resolverá
      const { data } = await supabase
        .from('worldcups')
        .update(update)
        .eq('id', worldcup.id)
        .select()
        .single()

      if (data) set({ worldcup: data as Worldcup, pendingCoinFlip: true })
      return
    }

    if (transition.type === 'continue') {
      const { data } = await supabase
        .from('worldcups')
        .update(update)
        .eq('id', worldcup.id)
        .select()
        .single()
      if (data) set({ worldcup: data as Worldcup })
      return
    }

    // advance / completed / eliminated
    if (transition.type === 'eliminated' || transition.type === 'completed') {
      update = { ...update, ended_at: new Date().toISOString() }
    }

    const { data, error } = await supabase
      .from('worldcups')
      .update(update)
      .eq('id', worldcup.id)
      .select()
      .single()

    if (error) {
      toast.error('Error actualizando el mundial')
      return
    }

    set({ worldcup: data as Worldcup })

    if (transition.type === 'advance') {
      const labels: Record<string, string> = {
        round_of_16: 'Octavos de Final',
        quarterfinals: 'Cuartos de Final',
        semifinals: 'Semifinal',
        final: 'Final',
      }
      toast.success(`¡Clasificaste! Avanzás a ${labels[transition.nextStage]} 🎉`)
    } else if (transition.type === 'completed') {
      toast.success('¡Campeón del Mundo! 🏆')
    } else if (transition.type === 'eliminated') {
      toast.error('Quedaste eliminado del mundial 😢')
    }
  },

  resolveCoinFlip: async (won: boolean) => {
    const { worldcup } = get()
    if (!worldcup) return

    let update: Partial<Worldcup>

    if (!won) {
      update = { status: 'eliminated', ended_at: new Date().toISOString() }
      toast.error('Perdiste la moneda — quedaste eliminado 😢')
    } else if (worldcup.current_stage === 'groups') {
      update = { current_stage: 'round_of_16' }
      toast.success('¡Ganaste la moneda! Clasificaste a Octavos 🎉')
    } else {
      const next = getNextStage(worldcup.current_stage)
      if (next) {
        update = { current_stage: next }
        const labels: Record<string, string> = {
          round_of_16: 'Octavos de Final',
          quarterfinals: 'Cuartos de Final',
          semifinals: 'Semifinal',
          final: 'Final',
        }
        toast.success(`¡Ganaste la moneda! Avanzás a ${labels[next]} 🎉`)
      } else {
        update = { status: 'completed', ended_at: new Date().toISOString() }
        toast.success('¡Campeón del Mundo! 🏆')
      }
    }

    const { data, error } = await supabase
      .from('worldcups')
      .update(update)
      .eq('id', worldcup.id)
      .select()
      .single()

    if (!error && data) set({ worldcup: data as Worldcup, pendingCoinFlip: false })
  },

  reset: () => set({ worldcup: null, loading: false, pendingCoinFlip: false }),
}))

