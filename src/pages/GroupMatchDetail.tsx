import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import type { GroupMatch, GroupMatchPlayer, Profile } from '../types'

interface PlayerFull extends GroupMatchPlayer {
  profile: Profile | null
}

interface MatchFull extends GroupMatch {
  players: PlayerFull[]
}

export function GroupMatchDetail() {
  const { groupId, matchId } = useParams<{ groupId: string; matchId: string }>()
  const navigate = useNavigate()
  const [match, setMatch] = useState<MatchFull | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchId || !groupId) return
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('group_matches')
        .select('*, group_match_players(*)')
        .eq('id', matchId)
        .single()

      if (error || !data) {
        setLoading(false)
        return
      }

      const raw = data as GroupMatch & { group_match_players: GroupMatchPlayer[] }
      const players = raw.group_match_players ?? []
      const userIds = players.map(p => p.user_id).filter(Boolean) as string[]

      let profileMap: Record<string, Profile> = {}
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, email, username, full_name')
          .in('id', userIds)
        for (const p of profileRows ?? []) profileMap[(p as Profile).id] = p as Profile
      }

      setMatch({
        ...raw,
        players: players.map(p => ({
          ...p,
          profile: p.user_id ? (profileMap[p.user_id] ?? null) : null,
        })),
      })
      setLoading(false)
    }
    load()
  }, [matchId, groupId])

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="text-muted-foreground text-sm self-start">
          ← Volver
        </button>
        <div className="flex flex-col gap-3">
          <div className="h-16 w-40 bg-muted rounded-xl animate-pulse mx-auto" />
          <div className="h-3 w-24 bg-muted/60 rounded animate-pulse mx-auto" />
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 animate-pulse mt-3">
            <div className="h-3 w-16 bg-muted rounded" />
            {[1, 2, 3].map(i => <div key={i} className="h-3 w-32 bg-muted/60 rounded" />)}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 animate-pulse">
            <div className="h-3 w-16 bg-muted rounded" />
            {[1, 2].map(i => <div key={i} className="h-3 w-28 bg-muted/60 rounded" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="text-muted-foreground text-sm self-start">
          ← Volver
        </button>
        <p className="text-muted-foreground text-sm text-center py-10">Partido no encontrado</p>
      </div>
    )
  }

  const teamA = match.players.filter(p => p.team === 'a')
  const teamB = match.players.filter(p => p.team === 'b')
  const date = new Date(match.played_at).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  function renderTeam(players: PlayerFull[], color: 'blue' | 'orange') {
    if (players.length === 0) {
      return <p className="text-sm text-muted-foreground italic">Sin jugadores registrados</p>
    }
    return (
      <div className="flex flex-col gap-2">
        {players.map(p => {
          const isGuest = !p.user_id
          const name = p.guest_name
            ? p.guest_name
            : `@${p.profile?.username ?? `usuario_${p.user_id!.slice(0, 6)}`}`
          const fullName = !isGuest && p.profile?.full_name ? p.profile.full_name : null
          return (
            <div key={p.id} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${isGuest ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {name}
                  {isGuest && <span className="ml-1 text-xs text-muted-foreground/60">(inv.)</span>}
                </span>
                {fullName && <span className="text-xs text-muted-foreground">{fullName}</span>}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {p.goals > 0 && (
                  <span className="flex items-center gap-1">
                    <span>⚽</span>
                    <span className="font-medium text-foreground">{p.goals}</span>
                  </span>
                )}
                {p.assists > 0 && (
                  <span className="flex items-center gap-1">
                    <span>🎯</span>
                    <span className="font-medium text-foreground">{p.assists}</span>
                  </span>
                )}
                {p.goals === 0 && p.assists === 0 && (
                  <span className="text-xs text-muted-foreground/50">–</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const scoreA = match.team_a_score
  const scoreB = match.team_b_score
  const winA = scoreA > scoreB
  const winB = scoreB > scoreA

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={() => navigate(`/groups/${groupId}`)}
        className="text-muted-foreground hover:text-foreground transition-colors text-sm self-start"
      >
        ← Volver al grupo
      </button>

      {/* Score hero */}
      <div className="flex flex-col items-center gap-1 py-4">
        <div className="flex items-center gap-5">
          <span className={`text-5xl font-bold tabular-nums transition-colors ${winA ? 'text-blue-400' : 'text-muted-foreground/60'}`}>
            {scoreA}
          </span>
          <span className="text-2xl text-muted-foreground font-light">–</span>
          <span className={`text-5xl font-bold tabular-nums transition-colors ${winB ? 'text-orange-400' : 'text-muted-foreground/60'}`}>
            {scoreB}
          </span>
        </div>
        <p className="text-xs text-muted-foreground capitalize mt-1">{date}</p>
        {scoreA === scoreB && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground mt-1">Empate</span>
        )}
      </div>

      {/* Replay */}
      {match.replay_url && (
        <a
          href={match.replay_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-blue-700/40 bg-blue-950/20 py-3 text-sm text-blue-400 hover:bg-blue-950/40 transition-colors"
        >
          🎬 Ver repetición
        </a>
      )}

      {/* Teams */}
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-lg">
              EQUIPO A
            </span>
            {winA && <span className="text-xs text-muted-foreground">ganador</span>}
          </div>
          {renderTeam(teamA, 'blue')}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-lg">
              EQUIPO B
            </span>
            {winB && <span className="text-xs text-muted-foreground">ganador</span>}
          </div>
          {renderTeam(teamB, 'orange')}
        </div>
      </div>
    </div>
  )
}
