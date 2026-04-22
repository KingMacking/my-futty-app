import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import type { Worldcup } from '../types'

export function useWorldcup(userId: string) {
  const [worldcup, setWorldcup] = useState<Worldcup | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrCreateWorldcup()
  }, [userId])

  async function getOrCreateWorldcup() {
    setLoading(true)

    // Buscar worldcup activo
    const { data: existing, error } = await supabase
      .from('worldcups')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    if (existing) {
      setWorldcup(existing as Worldcup)
      setLoading(false)
      return
    }

    // Si no tiene ninguno activo, crear uno nuevo
    const { data: created, error: createError } = await supabase
      .from('worldcups')
      .insert({ user_id: userId })
      .select()
      .single()

    if (createError) {
      console.error(createError)
    } else {
      setWorldcup(created as Worldcup)
    }

    setLoading(false)
  }

  return { worldcup, loading, refetch: getOrCreateWorldcup }
}
