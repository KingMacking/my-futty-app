import { Badge } from '@/components/ui/badge'
import type { Match } from '../types'

const RESULT_CONFIG = {
  win:  { label: 'Victoria', variant: 'default' as const, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  draw: { label: 'Empate',   variant: 'default' as const, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  lose: { label: 'Derrota',  variant: 'default' as const, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

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
  if (loading) {
    return <p className="text-muted-foreground text-sm text-center py-6">Cargando partidos...</p>
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-3xl mb-2">🏟️</p>
        <p className="text-muted-foreground text-sm">Todavía no registraste ningún partido</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {matches.map((match) => {
        const config = RESULT_CONFIG[match.result]
        return (
          <div
            key={match.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Badge className={config.className}>{config.label}</Badge>
              {match.counts_for_worldcup && (
                <span className="text-xs text-muted-foreground">🌍 Mundial</span>
              )}
              {match.replay_url && (
                <a
                  href={match.replay_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  🎬
                </a>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(match.played_at ?? match.created_at)}</span>
          </div>
        )
      })}
    </div>
  )
}
