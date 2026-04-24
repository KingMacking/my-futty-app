import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../services/supabase'
import { useGroupsStore } from '../store/groupsStore'
import { useAuthStore } from '../store/authStore'
import type { Match, Profile, Worldcup } from '../types'

const STAGE_LABELS: Record<string, string> = {
  groups:         'Fase de Grupos',
  round_of_16:    'Octavos',
  quarterfinals:  'Cuartos',
  semifinals:     'Semifinal',
  final:          'Final',
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active:     { label: '',           className: '' },
  eliminated: { label: 'Eliminado',  className: 'text-red-400 bg-red-950/50 border-red-800/40' },
  completed:  { label: 'Campeón 🏆', className: 'text-yellow-400 bg-yellow-950/50 border-yellow-800/40' },
}

const RESULT_ICON: Record<string, { icon: string; className: string; label: string }> = {
  win:  { icon: 'V', className: 'text-green-400 bg-green-950/50 border-green-800/40', label: 'Victoria' },
  draw: { icon: 'E', className: 'text-yellow-400 bg-yellow-950/50 border-yellow-800/40', label: 'Empate' },
  lose: { icon: 'D', className: 'text-red-400 bg-red-950/50 border-red-800/40', label: 'Derrota' },
  loss: { icon: 'D', className: 'text-red-400 bg-red-950/50 border-red-800/40', label: 'Derrota' },
}

interface ActivityItem extends Match {
  profile: Profile | null
}

interface Member {
  user_id: string
  joined_at: string
  profile: Profile | null
  worldcup: Worldcup | null
}

export function GroupDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const groups = useGroupsStore(state => state.groups)
  const storeGroup = groups.find(g => g.id === id)

  const leave = useGroupsStore(state => state.leave)

  const [groupFallback, setGroupFallback] = useState<typeof storeGroup>(undefined)
  const group = storeGroup ?? groupFallback
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'activity'>('members')
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const activityLoaded = useRef(false)
  const profileMapRef = useRef<Record<string, Profile | null>>({})

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)

      // Si el grupo no está en el store (ej: F5), cargarlo desde Supabase
      if (!storeGroup) {
        const { data } = await supabase.from('groups').select('*').eq('id', id).maybeSingle()
        if (!data) { setLoading(false); return }
        setGroupFallback(data)
      }
      const { data: memberRows, error } = await supabase
        .from('group_members')
        .select('user_id, joined_at')
        .eq('group_id', id)
        .order('joined_at', { ascending: true })

      if (error || !memberRows) { setLoading(false); return }

      const userIds = memberRows.map((r: { user_id: string }) => r.user_id)

      const [{ data: profileRows }, { data: worldcupRows }] = await Promise.all([
        supabase.from('profiles').select('id, email, username, full_name').in('id', userIds),
        supabase.from('worldcups').select('*').in('user_id', userIds).in('status', ['active', 'eliminated', 'completed']).order('created_at', { ascending: false }),
      ])

      const profileMap: Record<string, Profile> = {}
      for (const p of profileRows ?? []) profileMap[(p as Profile).id] = p as Profile
      profileMapRef.current = profileMap

      // Para cada user_id, tomar el mundial más reciente
      const worldcupMap: Record<string, Worldcup> = {}
      for (const w of worldcupRows ?? []) {
        const wc = w as Worldcup
        if (!worldcupMap[wc.user_id]) worldcupMap[wc.user_id] = wc
      }

      setMembers(
        memberRows.map((r: { user_id: string; joined_at: string }) => ({
          user_id: r.user_id,
          joined_at: r.joined_at,
          profile: profileMap[r.user_id] ?? null,
          worldcup: worldcupMap[r.user_id] ?? null,
        }))
      )
      setLoading(false)
    }
    load()
  // storeGroup incluido para satisfacer el linter; el efecto real depende de id
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (activeTab !== 'activity' || activityLoaded.current || loading) return
    activityLoaded.current = true
    async function loadActivity() {
      setActivityLoading(true)
      const userIds = members.map(m => m.user_id)
      const { data } = await supabase
        .from('matches')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(50)
      setActivity(
        (data ?? []).map((m: Match) => ({
          ...m,
          profile: profileMapRef.current[m.user_id] ?? null,
        }))
      )
      setActivityLoading(false)
    }
    loadActivity()
  }, [activeTab, loading, members])

  if (!group && loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-muted animate-pulse" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-4 w-36 bg-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted/60 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-2.5 w-16 bg-muted/60 rounded" />
                </div>
              </div>
              <div className="h-3 w-14 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

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
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Código: <span className="font-mono tracking-widest">{group.code}</span>
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join/${group.code}`)
                setCopied(true)
                toast.success('Link copiado')
                setTimeout(() => setCopied(false), 2000)
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
        {!confirmLeave ? (
          <button
            onClick={() => setConfirmLeave(true)}
            className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
          >
            Salir
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">¿Salir?</span>
            <button
              onClick={async () => {
                if (!session) return
                const groupId = group.id
                setLeaving(true)
                setConfirmLeave(false)
                const ok = await leave(session.user.id, groupId)
                if (ok) navigate('/groups')
                else setLeaving(false)
              }}
              disabled={leaving}
              className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              {leaving ? 'Saliendo...' : 'Sí'}
            </button>
            <button
              onClick={() => setConfirmLeave(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              No
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['members', 'activity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-foreground border-b-2 border-green-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'members' ? 'Miembros' : 'Actividad'}
          </button>
        ))}
      </div>

      {activeTab === 'members' && (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {loading ? 'Cargando...' : `${members.length} miembro${members.length !== 1 ? 's' : ''}`}
        </p>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-2.5 w-16 bg-muted/60 rounded" />
                  </div>
                </div>
                <div className="h-3 w-14 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          members.map(m => {
            const isMe = m.user_id === session?.user.id
            const username = m.profile?.username ?? `usuario_${m.user_id.slice(0, 6)}`
            const fullName = m.profile?.full_name ?? ''
            const wc = m.worldcup
            const badge = wc ? STATUS_BADGE[wc.status] : null

            return (
              <div
                key={m.user_id}
                onClick={() => navigate(
                  m.user_id === session?.user.id
                    ? '/profile'
                    : `/profile/${m.user_id}`
                )}
                className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
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
                  </div>
                </div>

                <div className="text-right">
                  {wc ? (
                    <>
                      {wc.status === 'active' && (
                        <p className="text-xs font-medium text-blue-400">{STAGE_LABELS[wc.current_stage]}</p>
                      )}
                      {wc.status !== 'active' && badge && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin mundial</p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      )}

      {activeTab === 'activity' && (
        <div className="flex flex-col gap-2">
          {activityLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted" />
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3 w-20 bg-muted rounded" />
                      <div className="h-2.5 w-14 bg-muted/60 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-6 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-10">Sin actividad todavía</p>
          ) : (
            activity.map(item => {
              const username = item.profile?.username ?? `usuario_${item.user_id.slice(0, 6)}`
              const isMe = item.user_id === session?.user.id
              const res = RESULT_ICON[item.result]
              if (!res) return null
              const date = new Date(item.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
              return (
                <div key={item.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                      {username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        @{username}
                        {isMe && <span className="ml-1.5 text-xs text-green-400">(vos)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {date}{item.counts_for_worldcup ? ' · mundial' : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${res.className}`}>
                    {res.icon}
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
