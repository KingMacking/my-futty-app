import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useGroupsStore } from '../store/groupsStore'
import { useAuthStore } from '../store/authStore'
import type { Profile } from '../types'

interface Member {
  user_id: string
  joined_at: string
  profile: Profile | null
}

export function GroupDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const groups = useGroupsStore(state => state.groups)
  const group = groups.find(g => g.id === id)

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)

      const { data: memberRows, error } = await supabase
        .from('group_members')
        .select('user_id, joined_at')
        .eq('group_id', id)
        .order('joined_at', { ascending: true })

      if (error || !memberRows) { setLoading(false); return }

      const userIds = memberRows.map((r: { user_id: string }) => r.user_id)

      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, email, username, full_name')
        .in('id', userIds)

      const profileMap: Record<string, Profile> = {}
      for (const p of profileRows ?? []) {
        profileMap[(p as Profile).id] = p as Profile
      }

      setMembers(
        memberRows.map((r: { user_id: string; joined_at: string }) => ({
          user_id: r.user_id,
          joined_at: r.joined_at,
          profile: profileMap[r.user_id] ?? null,
        }))
      )
      setLoading(false)
    }
    load()
  }, [id])

  if (!group) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => navigate('/groups')} className="text-muted-foreground text-sm self-start">
          ← Volver
        </button>
        <p className="text-muted-foreground text-sm text-center py-10">Grupo no encontrado</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/groups')} className="text-muted-foreground hover:text-foreground transition-colors">
          ←
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{group.name}</h2>
          <p className="text-xs text-muted-foreground">
            Código: <span className="font-mono tracking-widest">{group.code}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {loading ? 'Cargando...' : `${members.length} miembro${members.length !== 1 ? 's' : ''}`}
        </p>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm animate-pulse">Cargando miembros...</div>
        ) : (
          members.map(m => {
            const isMe = m.user_id === session?.user.id
            const username = m.profile?.username ?? `usuario_${m.user_id.slice(0, 6)}`
            const fullName = m.profile?.full_name ?? ''
            return (
              <div
                key={m.user_id}
                className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      @{username}
                      {isMe && <span className="ml-2 text-xs text-green-400">(vos)</span>}
                    </p>
                    {fullName && <p className="text-xs text-muted-foreground">{fullName}</p>}
                    <p className="text-xs text-muted-foreground">
                      desde {new Date(m.joined_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
