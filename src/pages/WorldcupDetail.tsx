import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import type { Match, Worldcup } from '../types'

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

const RESULT_STYLE: Record<string, { icon: string; className: string }> = {
  win:  { icon: 'V', className: 'text-green-400 bg-green-950/50 border-green-800/40' },
  draw: { icon: 'E', className: 'text-yellow-400 bg-yellow-950/50 border-yellow-800/40' },
  lose: { icon: 'D', className: 'text-red-400 bg-red-950/50 border-red-800/40' },
}

interface WorldcupMatch extends Match {
  stage: string
}

export function WorldcupDetail() {
  const { worldcupId } = useParams<{ worldcupId: string }>()
  const navigate = useNavigate()

  const [worldcup, setWorldcup] = useState<Worldcup | null>(null)
  const [wcMatches, setWcMatches] = useState<WorldcupMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!worldcupId) return
    async function load() {
      setLoading(true)
      const [{ data: wcData }, { data: wmData }] = await Promise.all([
        supabase.from('worldcups').select('*').eq('id', worldcupId).maybeSingle(),
        supabase
          .from('worldcup_matches')
          .select('stage, matches(*)')
          .eq('worldcup_id', worldcupId),
      ])

      setWorldcup(wcData as Worldcup ?? null)
      const mapped = ((wmData ?? []) as { stage: string; matches: Match }[])
        .map(row => ({ ...row.matches, stage: row.stage }))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      setWcMatches(mapped)
      setLoading(false)
    }
    load()
  }, [worldcupId])

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors text-sm self-start">
          ← Volver
        </button>
        <div className="rounded-2xl border border-border bg-card p-5 animate-pulse flex flex-col gap-3">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted/60 rounded" />
        </div>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between animate-pulse">
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-2.5 w-16 bg-muted/60 rounded" />
              </div>
              <div className="h-6 w-6 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!worldcup) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground text-sm self-start">← Volver</button>
        <p className="text-muted-foreground text-sm text-center py-10">Mundial no encontrado</p>
      </div>
    )
  }

  const isChampion  = worldcup.status === 'completed'
  const isEliminated = worldcup.status === 'eliminated'
  const isActive     = worldcup.status === 'active'

  const pj      = wcMatches.length
  const wins    = wcMatches.filter(m => m.result === 'win').length
  const draws   = wcMatches.filter(m => m.result === 'draw').length
  const losses  = wcMatches.filter(m => m.result === 'lose').length
  const totalGoals   = wcMatches.reduce((acc, m) => acc + (m.goals ?? 0), 0)
  const totalAssists = wcMatches.reduce((acc, m) => acc + (m.assists ?? 0), 0)
  const hasGoalStats = wcMatches.some(m => m.goals !== null || m.assists !== null)

  // Agrupar por etapa, ordenado por STAGE_ORDER
  const byStage = wcMatches.reduce<Record<string, WorldcupMatch[]>>((acc, m) => {
    if (!acc[m.stage]) acc[m.stage] = []
    acc[m.stage].push(m)
    return acc
  }, {})
  const stages = Object.keys(byStage).sort((a, b) => (STAGE_ORDER[a] ?? 0) - (STAGE_ORDER[b] ?? 0))

  const startDate = new Date(worldcup.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  const endDate   = worldcup.ended_at ? new Date(worldcup.ended_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : null

  return (
    <div className="flex flex-col gap-5">
      <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors text-sm self-start">
        ← Volver
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="font-bold text-base">
            {isChampion ? 'Campeón 🏆' : isEliminated ? `Eliminado en ${STAGE_LABELS[worldcup.current_stage]}` : `En curso — ${STAGE_LABELS[worldcup.current_stage]}`}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
            isChampion  ? 'text-yellow-400 bg-yellow-950/50 border-yellow-800/40' :
            isEliminated ? 'text-red-400 bg-red-950/50 border-red-800/40' :
            'text-blue-400 bg-blue-950/50 border-blue-800/40'
          }`}>
            {isChampion ? 'Ganado' : isEliminated ? 'Eliminado' : 'Activo'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {startDate}{endDate ? ` – ${endDate}` : isActive ? ' · en curso' : ''}
        </p>
      </div>

      {/* Stats */}
      {pj > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estadísticas</p>
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold">{pj}</p>
              <p className="text-xs text-muted-foreground mt-0.5">PJ</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold text-green-400">{wins}</p>
              <p className="text-xs text-muted-foreground mt-0.5">V</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold text-yellow-400">{draws}</p>
              <p className="text-xs text-muted-foreground mt-0.5">E</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold text-red-400">{losses}</p>
              <p className="text-xs text-muted-foreground mt-0.5">D</p>
            </div>
          </div>
          {hasGoalStats && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="text-xl font-bold">⚽ {totalGoals}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Goles</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="text-xl font-bold">🎯 {totalAssists}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Asistencias</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Partidos por etapa */}
      {stages.length > 0 && (
        <div className="flex flex-col gap-4">
          {stages.map(stage => (
            <div key={stage} className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {STAGE_LABELS[stage] ?? stage}
              </p>
              {byStage[stage].map(m => {
                const res = RESULT_STYLE[m.result]
                if (!res) return null
                const date = new Date(m.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                const sub = [m.goals !== null ? `⚽ ${m.goals}` : '', m.assists !== null ? `🎯 ${m.assists}` : ''].filter(Boolean).join(' · ')
                return (
                  <div key={m.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{date}</p>
                      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${res.className}`}>
                      {res.icon}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {pj === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">Sin partidos registrados en este mundial</p>
      )}
    </div>
  )
}
