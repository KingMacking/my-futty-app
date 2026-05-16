import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../services/supabase'
import { useGroupsStore } from '../store/groupsStore'
import { useAuthStore } from '../store/authStore'
import { GroupMatchForm } from '../components/GroupMatchForm'
import { TeamDrawModal } from '../components/TeamDrawModal'
import { STAGE_LABELS } from '../constants/worldcup'
import type { Profile, Worldcup, GroupMatch, GroupMatchPlayer } from '../types'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active:     { label: '',           className: '' },
  eliminated: { label: 'Eliminado',  className: 'text-red-400 bg-red-950/50 border-red-800/40' },
  completed:  { label: 'Campeón 🏆', className: 'text-yellow-400 bg-yellow-950/50 border-yellow-800/40' },
}

interface Member {
  user_id: string
  joined_at: string
  role: 'member' | 'admin'
  profile: Profile | null
  worldcup: Worldcup | null
}

interface GroupMatchFull extends GroupMatch {
  players: Array<GroupMatchPlayer & { profile: Profile | null }>
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
  const [activeTab, setActiveTab] = useState<'members' | 'matches'>('members')
  const [groupMatches, setGroupMatches] = useState<GroupMatchFull[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const matchesLoaded = useRef(false)
  const [showMatchForm, setShowMatchForm] = useState(false)
  const [showDraw, setShowDraw] = useState(false)
  const [confirmKick, setConfirmKick] = useState<string | null>(null)
  const profileMapRef = useRef<Record<string, Profile | null>>({})

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)

      if (!storeGroup) {
        const { data } = await supabase.from('groups').select('*').eq('id', id).maybeSingle()
        if (!data) { setLoading(false); return }
        setGroupFallback(data)
      }

      const { data: memberRows, error } = await supabase
        .from('group_members')
        .select('user_id, joined_at, role')
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

      const worldcupMap: Record<string, Worldcup> = {}
      for (const w of worldcupRows ?? []) {
        const wc = w as Worldcup
        if (!worldcupMap[wc.user_id]) worldcupMap[wc.user_id] = wc
      }

      setMembers(
        memberRows.map((r: { user_id: string; joined_at: string; role: string }) => ({
          user_id: r.user_id,
          joined_at: r.joined_at,
          role: (r.role ?? 'member') as 'member' | 'admin',
          profile: profileMap[r.user_id] ?? null,
          worldcup: worldcupMap[r.user_id] ?? null,
        }))
      )
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadMatches() {
    if (!id) return
    setMatchesLoading(true)
    const { data } = await supabase
      .from('group_matches')
      .select('*, group_match_players(*)')
      .eq('group_id', id)
      .order('created_at', { ascending: false })
      .limit(30)
    setGroupMatches(
      ((data ?? []) as unknown as (GroupMatch & { group_match_players: GroupMatchPlayer[] })[])
        .map(m => ({
          ...m,
          players: (m.group_match_players ?? []).map(p => ({
            ...p,
              profile: p.user_id ? (profileMapRef.current[p.user_id] ?? null) : null,
          })),
        }))
    )
    setMatchesLoading(false)
  }

  useEffect(() => {
    if (activeTab !== 'matches' || matchesLoaded.current || loading) return
    matchesLoaded.current = true
    loadMatches()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loading])

  async function kickMember(userId: string) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', id!)
      .eq('user_id', userId)
    if (error) {
      toast.error('Error al expulsar el miembro')
      return
    }
    setMembers(prev => prev.filter(m => m.user_id !== userId))
    setConfirmKick(null)
    toast.success('Miembro expulsado')
  }

  async function toggleAdmin(userId: string, currentRole: 'member' | 'admin') {
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    const { data, error } = await supabase
      .from('group_members')
      .update({ role: newRole })
      .eq('group_id', id!)
      .eq('user_id', userId)
      .select()
    if (error || !data || data.length === 0) {
      toast.error('No se pudo actualizar el rol — revisá los permisos en Supabase (RLS)')
      return
    }
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m))
    toast.success(newRole === 'admin' ? 'Ahora es admin' : 'Rol de admin removido')
  }

  const isCreator = group?.created_by === session?.user.id
  const myMember = members.find(m => m.user_id === session?.user.id)
  const canCreateMatch = isCreator || myMember?.role === 'admin'

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
        {(['members', 'matches'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-foreground border-b-2 border-green-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'members' ? 'Miembros' : 'Partidos'}
          </button>
        ))}
      </div>

      {activeTab === 'members' && (
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowDraw(true)}
          className="flex items-center mb-2 justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:text-foreground hover:border-purple-500/50 transition-colors mt-1"
        >
          🎲 Sortear equipos
        </button>
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
            const memberIsCreator = m.user_id === group?.created_by

            return (
              <div key={m.user_id} className="flex flex-col">
                <div
                  className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(isMe ? '/profile' : `/profile/${m.user_id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                      {username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                        @{username}
                        {isMe && <span className="text-xs text-green-400">(vos)</span>}
                        {memberIsCreator && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full border border-yellow-700/60 bg-yellow-950/40 text-yellow-400 font-normal">
                            creador
                          </span>
                        )}
                        {!memberIsCreator && m.role === 'admin' && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full border border-blue-700/60 bg-blue-950/40 text-blue-400 font-normal">
                            admin
                          </span>
                        )}
                      </p>
                      {fullName && <p className="text-xs text-muted-foreground">{fullName}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Worldcup status */}
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

                    {/* Admin actions (creator only, not on self or other creators) */}
                    {isCreator && !isMe && !memberIsCreator && (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => toggleAdmin(m.user_id, m.role)}
                          title={m.role === 'admin' ? 'Quitar admin' : 'Dar admin'}
                          className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${
                            m.role === 'admin'
                              ? 'border-blue-700/60 text-blue-400 hover:bg-red-950/30 hover:border-red-700/60 hover:text-red-400'
                              : 'border-border text-muted-foreground hover:border-blue-500/50 hover:text-blue-400'
                          }`}
                        >
                          ★
                        </button>
                        <button
                          onClick={() => setConfirmKick(m.user_id)}
                          title="Expulsar"
                          className="text-xs px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:border-red-500/50 hover:text-red-400 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kick confirmation inline */}
                {confirmKick === m.user_id && (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-red-950/30 border border-red-800/40 rounded-xl mt-1">
                    <span className="text-xs text-red-300">¿Expulsar a @{username}?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => kickMember(m.user_id)}
                        className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmKick(null)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
        
      </div>
      )}

      {activeTab === 'matches' && (
        <div className="flex flex-col gap-3">
          {canCreateMatch && (
            <button
              onClick={() => setShowMatchForm(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:text-foreground hover:border-green-500/50 transition-colors"
            >
              <span className="text-lg leading-none">+</span>
              Nuevo partido
            </button>
          )}

          {matchesLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-6 w-16 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted/60 rounded" />
                  </div>
                  <div className="h-3 w-40 bg-muted/60 rounded" />
                  <div className="h-3 w-32 bg-muted/60 rounded" />
                </div>
              ))}
            </div>
          ) : groupMatches.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-10">
              {canCreateMatch ? 'Todavía no hay partidos. ¡Creá el primero!' : 'Todavía no hay partidos registrados.'}
            </p>
          ) : (
            groupMatches.map(match => {
              const teamA = match.players.filter(p => p.team === 'a')
              const teamB = match.players.filter(p => p.team === 'b')
              const date = new Date(match.played_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })

              function renderPlayers(players: typeof teamA) {
                if (players.length === 0) return <span className="text-muted-foreground italic">–</span>
                return players.map((p, i) => {
                  const name = p.guest_name
                    ? p.guest_name
                    : p.user_id
                      ? `@${p.profile?.username ?? `usuario_${p.user_id.slice(0, 6)}`}`
                      : '?'
                  const isGuest = !p.user_id
                  const stats = []
                  if (p.goals > 0) stats.push(`⚽${p.goals}`)
                  if (p.assists > 0) stats.push(`🎯${p.assists}`)
                  return (
                    <span key={p.id}>
                      {i > 0 && ', '}
                      <span className={isGuest ? 'text-muted-foreground' : ''}>{name}</span>
                      {isGuest && <span className="text-muted-foreground/60 text-[10px]"> (inv.)</span>}
                      {stats.length > 0 && <span className="text-muted-foreground"> {stats.join(' ')}</span>}
                    </span>
                  )
                })
              }

              return (
                <div
                  key={match.id}
                  className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(`/groups/${id}/matches/${match.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold tabular-nums">
                        <span className="text-blue-400">{match.team_a_score}</span>
                        <span className="text-muted-foreground mx-1.5">–</span>
                        <span className="text-orange-400">{match.team_b_score}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {match.replay_url && (
                        <a
                          href={match.replay_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-0.5 rounded-lg border border-blue-700/40 bg-blue-950/20 text-blue-400 hover:bg-blue-950/50 transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          🎬
                        </a>
                      )}
                      <span className="text-xs text-muted-foreground">{date}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-blue-400 shrink-0">A:</span>
                      <span className="text-foreground/90 leading-relaxed">{renderPlayers(teamA)}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-orange-400 shrink-0">B:</span>
                      <span className="text-foreground/90 leading-relaxed">{renderPlayers(teamB)}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {showMatchForm && session && (
        <GroupMatchForm
          groupId={id!}
          currentUserId={session.user.id}
          members={members.map(m => ({ user_id: m.user_id, profile: m.profile }))}
          onClose={() => setShowMatchForm(false)}
          onCreated={() => {
            setShowMatchForm(false)
            matchesLoaded.current = false
            loadMatches()
          }}
        />
      )}

      {showDraw && (
        <TeamDrawModal
          members={members.map(m => ({ user_id: m.user_id, profile: m.profile }))}
          onClose={() => setShowDraw(false)}
        />
      )}
    </div>
  )
}
