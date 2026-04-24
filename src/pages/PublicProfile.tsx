import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import type { Match, Profile, Worldcup } from '../types'

const STAGE_LABELS: Record<string, string> = {
  groups:        'Fase de Grupos',
  round_of_16:   'Octavos',
  quarterfinals: 'Cuartos',
  semifinals:    'Semifinal',
  final:         'Final',
}

const STAGE_ORDER: Record<string, number> = {
  groups: 1, round_of_16: 2, quarterfinals: 3, semifinals: 4, final: 5,
}
const STAGE_SHORT: Record<string, string> = {
  groups: 'Grupos', round_of_16: 'Octavos', quarterfinals: 'Cuartos', semifinals: 'Semis', final: 'Final',
}

export function PublicProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [worldcup, setWorldcup] = useState<Worldcup | null>(null)
  const [history, setHistory] = useState<Worldcup[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    async function load() {
      setLoading(true)

      const [
        { data: profileData },
        { data: activeWc },
        { data: historyData },
        { data: matchData },
      ] = await Promise.all([
        supabase.from('profiles').select('id, email, username, full_name').eq('id', userId).maybeSingle(),
        supabase.from('worldcups').select('*').eq('user_id', userId).in('status', ['active', 'eliminated', 'completed']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('worldcups').select('*').eq('user_id', userId).in('status', ['eliminated', 'completed']).order('created_at', { ascending: false }),
        supabase.from('matches').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ])

      setProfile(profileData as Profile ?? null)
      setWorldcup(activeWc as Worldcup ?? null)
      setHistory((historyData ?? []) as Worldcup[])
      setMatches((matchData ?? []) as Match[])
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors text-sm self-start">
          ← Volver
        </button>
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-3 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-muted" />
          <div className="flex flex-col items-center gap-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted/60 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground text-sm self-start">
          ← Volver
        </button>
        <p className="text-muted-foreground text-sm text-center py-10">Perfil no encontrado</p>
      </div>
    )
  }

  const username = profile.username ?? `usuario_${profile.id.slice(0, 6)}`
  const initial = username[0].toUpperCase()

  // -- Stats de partidos --
  const totalMatches = matches.length
  const wins   = matches.filter(m => m.result === 'win').length
  const draws  = matches.filter(m => m.result === 'draw').length
  const losses = matches.filter(m => m.result === 'lose').length
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

  const currentStreak = (() => {
    if (matches.length === 0) return null
    const first = matches[0].result
    let count = 0
    for (const m of matches) {
      if (m.result === first) count++
      else break
    }
    return { count, result: first }
  })()
  const streakLabelPlural: Record<string, string> = { win: 'victorias', draw: 'empates', lose: 'derrotas' }

  const bestWinStreak = (() => {
    let best = 0, current = 0
    for (const m of [...matches].reverse()) {
      if (m.result === 'win') { current++; if (current > best) best = current }
      else current = 0
    }
    return best
  })()

  // -- Stats de mundiales --
  const totalWorldcups = history.length
  const wonWorldcups   = history.filter(w => w.status === 'completed').length
  const classifiedCount = history.filter(w => STAGE_ORDER[w.current_stage] > 1 || w.status === 'completed').length
  const classificationRate = totalWorldcups > 0 ? Math.round((classifiedCount / totalWorldcups) * 100) : 0
  const bestStage = history.length > 0
    ? STAGE_SHORT[history.reduce((best, w) =>
        STAGE_ORDER[w.current_stage] > STAGE_ORDER[best.current_stage] ? w : best
      ).current_stage]
    : '—'

  return (
    <div className="flex flex-col gap-5">
      <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors text-sm self-start">
        ← Volver
      </button>

      {/* Avatar + nombre */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-foreground">
          {initial}
        </div>
        <div className="text-center">
          <p className="font-bold text-lg">{profile.full_name ?? username}</p>
          <p className="text-muted-foreground text-sm">@{username}</p>
        </div>
      </div>

      {/* Mundial actual */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mundial actual</p>
        {worldcup ? (
          <>
            {worldcup.status === 'active' && (
              <p className="text-sm font-medium text-blue-400">{STAGE_LABELS[worldcup.current_stage]}</p>
            )}
            {worldcup.status === 'eliminated' && (
              <p className="text-sm font-medium text-red-400">Eliminado en {STAGE_LABELS[worldcup.current_stage]}</p>
            )}
            {worldcup.status === 'completed' && (
              <p className="text-sm font-medium text-yellow-400">Campeón 🏆</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sin mundial activo</p>
        )}
      </div>

      {/* Stats de partidos */}
      {totalMatches > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Partidos</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold text-green-400">{wins}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Victorias</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold text-yellow-400">{draws}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Empates</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold text-red-400">{losses}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Derrotas</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold">{totalMatches}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold">{winRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Win rate</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold">{bestWinStreak}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Mejor racha</p>
            </div>
          </div>
          {currentStreak && currentStreak.count >= 2 && (
            <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-2">
              <span className="text-lg">
                {currentStreak.result === 'win' ? '🔥' : currentStreak.result === 'draw' ? '➡️' : '❄️'}
              </span>
              <p className="text-sm">
                <span className="font-semibold">{currentStreak.count}</span>
                <span className="text-muted-foreground ml-1">
                  {streakLabelPlural[currentStreak.result]} seguidas
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats de mundiales */}
      {totalWorldcups > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mundiales</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold">{totalWorldcups}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Jugados</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold text-yellow-400">{wonWorldcups}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ganados 🏆</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold">{classificationRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Clasificación</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold">{bestStage}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Mejor etapa</p>
            </div>
          </div>
        </div>
      )}

      {/* Historial de partidos */}
      {matches.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Partidos recientes</p>
          {matches.slice(0, 20).map(m => {
            const res = { win: { icon: 'V', className: 'text-green-400 bg-green-950/50 border-green-800/40' }, draw: { icon: 'E', className: 'text-yellow-400 bg-yellow-950/50 border-yellow-800/40' }, lose: { icon: 'D', className: 'text-red-400 bg-red-950/50 border-red-800/40' } }[m.result]
            const date = new Date(m.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
            return (
              <div key={m.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{date}</p>
                  {m.counts_for_worldcup && <p className="text-xs text-muted-foreground">mundial</p>}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${res.className}`}>
                  {res.icon}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
