import { WorldcupPath } from '../components/WorldcupPath'
import { CoinFlipModal } from '../components/CoinFlipModal'
import { useWorldcupStore } from '../store/worldcupStore'
import { useAuthStore } from '../store/authStore'
import { useMatchesStore } from '../store/matchesStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Match } from '../types'

function computeStreak(matches: Match[]): { count: number; type: 'win' | 'lose' | 'draw' | null } {
  if (matches.length === 0) return { count: 0, type: null }
  const first = matches[0].result
  let count = 0
  for (const m of matches) {
    if (m.result === first) count++
    else break
  }
  return { count, type: first }
}

const STREAK_CONFIG = {
  win:  { label: 'racha ganadora', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  draw: { label: 'empates seguidos', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  lose: { label: 'racha perdedora', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
}

const RESULT_DOT: Record<string, string> = {
  win:  'bg-green-400',
  draw: 'bg-yellow-400',
  lose: 'bg-red-400',
}

export function Dashboard() {
  const { worldcup, loading, createNew } = useWorldcupStore()
  const { session } = useAuthStore()
  const { matches } = useMatchesStore()

  const streak = computeStreak(matches)
  const recent = matches.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Cargando mundial...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Racha + últimos partidos */}
      {matches.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Forma reciente</p>
            {streak.type && streak.count >= 2 && (
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full border',
                STREAK_CONFIG[streak.type].bg,
                STREAK_CONFIG[streak.type].color,
              )}>
                {streak.count} {STREAK_CONFIG[streak.type].label}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 items-center">
            {recent.map(m => (
              <div
                key={m.id}
                title={m.result}
                className={cn('w-5 h-5 rounded-full', RESULT_DOT[m.result])}
              />
            ))}
            {matches.length > 5 && (
              <span className="text-xs text-muted-foreground ml-1">+{matches.length - 5}</span>
            )}
          </div>
        </div>
      )}

      {/* Mundial */}
      {!worldcup ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <span className="text-4xl">⚽</span>
          <p className="font-semibold">No hay mundial activo</p>
          <p className="text-sm text-muted-foreground">
            Arrancá un nuevo mundial o registrá un partido con "Cuenta para mi mundial".
          </p>
          <Button onClick={() => session && createNew(session.user.id)}>
            ⚽ Nuevo Mundial
          </Button>
        </div>
      ) : (
        <>
          <WorldcupPath worldcup={worldcup} />
          {(worldcup.status === 'eliminated' || worldcup.status === 'completed') && (
            <div className="flex justify-center pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => session && createNew(session.user.id)}
              >
                ⚽ Nuevo Mundial
              </Button>
            </div>
          )}
        </>
      )}

      <CoinFlipModal />
    </div>
  )
}

