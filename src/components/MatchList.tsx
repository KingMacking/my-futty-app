import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Match, MatchResult } from '../types'

const RESULT_CONFIG: Record<MatchResult, { label: string; short: string; className: string; dot: string }> = {
  win:  { label: 'Victoria', short: 'V', className: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-400' },
  draw: { label: 'Empate',   short: 'E', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-400' },
  lose: { label: 'Derrota',  short: 'D', className: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-400' },
}

const FILTERS: { key: MatchResult | 'all'; label: string }[] = [
  { key: 'all',  label: 'Todos' },
  { key: 'win',  label: 'Victorias' },
  { key: 'draw', label: 'Empates' },
  { key: 'lose', label: 'Derrotas' },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short',
  })
}

interface Props {
  matches: Match[]
  loading: boolean
}

export function MatchList({ matches, loading }: Props) {
  const [filter, setFilter] = useState<MatchResult | 'all'>('all')

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-5 w-16 bg-muted rounded-full" />
              <div className="h-3 w-10 bg-muted/60 rounded" />
            </div>
            <div className="h-3 w-14 bg-muted/60 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-3xl mb-2">🏟️</p>
        <p className="text-muted-foreground text-sm">Todavía no registraste ningún partido</p>
      </div>
    )
  }

  const filtered = filter === 'all' ? matches : matches.filter(m => m.result === filter)

  const wins   = matches.filter(m => m.result === 'win').length
  const draws  = matches.filter(m => m.result === 'draw').length
  const losses = matches.filter(m => m.result === 'lose').length

  return (
    <div className="flex flex-col gap-3">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2">
        {([['win', wins, 'text-green-400'], ['draw', draws, 'text-yellow-400'], ['lose', losses, 'text-red-400']] as const).map(([r, count, color]) => (
          <button
            key={r}
            onClick={() => setFilter(prev => prev === r ? 'all' : r)}
            className={cn(
              'rounded-xl border p-2.5 text-center transition-all',
              filter === r
                ? RESULT_CONFIG[r].className + ' border-current'
                : 'border-border bg-card hover:bg-muted/40'
            )}
          >
            <p className={cn('text-lg font-bold leading-none', filter === r ? '' : color)}>{count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{RESULT_CONFIG[r].label}</p>
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'shrink-0 text-xs px-3 py-1 rounded-full border transition-colors',
              filter === f.key
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1 opacity-60">
                {f.key === 'win' ? wins : f.key === 'draw' ? draws : losses}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Match rows */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No hay partidos con ese filtro
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((match) => {
            const config = RESULT_CONFIG[match.result]
            const hasStats = match.goals !== null || match.assists !== null
            const sub: string[] = []
            if (match.counts_for_worldcup) sub.push('🌍 Mundial')
            if (match.goals !== null) sub.push(`⚽ ${match.goals}`)
            if (match.assists !== null) sub.push(`🎯 ${match.assists}`)

            return (
              <div
                key={match.id}
                className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn(
                    'shrink-0 text-xs font-bold w-6 h-6 rounded-full border flex items-center justify-center',
                    config.className
                  )}>
                    {config.short}
                  </span>
                  <div className="min-w-0">
                    {sub.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">{sub.join(' · ')}</p>
                    )}
                  </div>
                  {match.replay_url && (
                    <a
                      href={match.replay_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      🎬
                    </a>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground ml-2">
                  {formatDate(match.played_at ?? match.created_at)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
