import { create } from 'zustand'
import { toast } from 'sonner'
import { supabase } from '../services/supabase'
import type { Group } from '../types'

interface GroupsState {
  groups: Group[]
  loading: boolean
  submitting: boolean
  fetch: (userId: string) => Promise<void>
  create: (userId: string, name: string) => Promise<boolean>
  join: (userId: string, code: string) => Promise<boolean>
  leave: (userId: string, groupId: string) => Promise<boolean>
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  loading: false,
  submitting: false,

  fetch: async (userId: string) => {
    set({ loading: true })

    // Traer grupos del usuario con conteo de miembros
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, code, created_by, created_at)')
      .eq('user_id', userId)

    if (error) {
      toast.error('Error cargando grupos')
      set({ loading: false })
      return
    }

    const groupIds = (data ?? []).map((r: { group_id: string }) => r.group_id)

    if (groupIds.length === 0) {
      set({ groups: [], loading: false })
      return
    }

    // Obtener conteo de miembros por grupo
    const { data: counts } = await supabase
      .from('group_members')
      .select('group_id')
      .in('group_id', groupIds)

    const countMap: Record<string, number> = {}
    for (const row of counts ?? []) {
      countMap[row.group_id] = (countMap[row.group_id] ?? 0) + 1
    }

    const groups: Group[] = (data ?? [])
      .map((r: { groups: unknown }) => r.groups)
      .filter(Boolean)
      .map((g: unknown) => {
        const group = g as Group
        return { ...group, member_count: countMap[group.id] ?? 1 }
      })

    set({ groups, loading: false })
  },

  create: async (userId: string, name: string) => {
    set({ submitting: true })
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data, error } = await supabase
      .from('groups')
      .insert({ name: name.trim(), created_by: userId, code })
      .select()
      .single()

    if (error) {
      toast.error('Error creando el grupo')
      set({ submitting: false })
      return false
    }

    // Auto-unirse al grupo creado como admin
    await supabase.from('group_members').insert({ group_id: data.id, user_id: userId, role: 'admin' })

    const newGroup: Group = { ...data, member_count: 1 }
    set({ groups: [newGroup, ...get().groups], submitting: false })
    toast.success(`Grupo "${data.name}" creado — código: ${code}`)
    return true
  },

  join: async (userId: string, code: string) => {
    set({ submitting: true })

    const { data: group, error } = await supabase
      .from('groups')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle()

    if (error || !group) {
      toast.error('Código de grupo inválido')
      set({ submitting: false })
      return false
    }

    const already = get().groups.find(g => g.id === group.id)
    if (already) {
      toast.error('Ya sos miembro de ese grupo')
      set({ submitting: false })
      return false
    }

    const { error: joinError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId })

    if (joinError) {
      toast.error('Error al unirse al grupo')
      set({ submitting: false })
      return false
    }

    const { data: countData } = await supabase
      .from('group_members')
      .select('id', { count: 'exact' })
      .eq('group_id', group.id)

    const newGroup: Group = { ...group, member_count: countData?.length ?? 1 }
    set({ groups: [newGroup, ...get().groups], submitting: false })
    toast.success(`Te uniste a "${group.name}"`)
    return true
  },

  leave: async (userId: string, groupId: string) => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('user_id', userId)
      .eq('group_id', groupId)

    if (error) {
      toast.error('Error al salir del grupo')
      return false
    }

    set({ groups: get().groups.filter(g => g.id !== groupId) })
    toast.success('Saliste del grupo')
    return true
  },
}))
