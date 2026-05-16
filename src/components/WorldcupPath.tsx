import { cn } from '@/lib/utils'
import type { Worldcup } from '../types'

const STAGES: { key: string; label: string; shortLabel: string; emoji: string }[] = [
  { key: 'groups',        label: 'Fase de Grupos',   shortLabel: 'Grupos',   emoji: '⚽' },
  { key: 'round_of_16',   label: 'Octavos de Final', shortLabel: 'Octavos',  emoji: '🔥' },
  { key: 'quarterfinals', label: 'Cuartos de Final', shortLabel: 'Cuartos',  emoji: '⚡' },
  { key: 'semifinals',    label: 'Semifinal',        shortLabel: 'Semi',     emoji: '🌟' },
  { key: 'final',         label: 'Final',            shortLabel: 'Final',    emoji: '🏆' },
]

function durationDays(start: string, end: string | null) {
  if (!end) return null
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const days = Math.round(diff / 86_400_000)
  if (days === 0) return 'hoy'
  if (days === 1) return '1 día'
  return `${days} días`
}

interface Props {
  worldcup: Worldcup
}

export function WorldcupPath({ worldcup }: Props) {
  const currentIndex = STAGES.findIndex(s => s.key === worldcup.current_stage)
  const duration = durationDays(worldcup.created_at, worldcup.ended_at)
  const stagesReached = currentIndex // 0 = groups, 4 = final
  const groupTotal = worldcup.group_wins + worldcup.group_draws + worldcup.group_losses

  if (worldcup.status === 'eliminated') {
    const stage = STAGES.find(s => s.key === worldcup.current_stage)
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
          <p className="text-5xl mb-3">😢</p>
          <h2 className="text-xl font-bold mb-1">Eliminado</h2>
          <p className="text-muted-foreground text-sm">
            Quedaste en <span className="text-foreground font-semibold">{stage?.label}</span>
          </p>
          {stagesReached > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Pasaste <span className="text-foreground font-semibold">{stagesReached}</span> fase{stagesReached !== 1 ? 's' : ''}
            </p>
          )}
          {groupTotal > 0 && (
            <div className="flex justify-center gap-3 mt-4 text-xs">
              <span className="text-green-400">{worldcup.group_wins}V</span>
              <span className="text-yellow-400">{worldcup.group_draws}E</span>
              <span className="text-red-400">{worldcup.group_losses}D</span>
              <span className="text-muted-foreground">en grupos</span>
            </div>
          )}
          {duration && (
            <p className="text-xs text-muted-foreground mt-2">Duración: {duration}</p>
          )}
          <p className="text-muted-foreground text-xs mt-3">
            Registrá un partido con "Cuenta para mi mundial" para arrancar uno nuevo
          </p>
        </div>
        <StageBar currentIndex={currentIndex} eliminated />
      </div>
    )
  }

  if (worldcup.status === 'completed') {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-yellow-500/40 bg-yellow-950/20 p-6 text-center">
          <p className="text-6xl mb-3">🏆</p>
          <h2 className="text-2xl font-bold mb-1">¡Campeón del Mundo!</h2>
          <p className="text-yellow-300/80 text-sm font-medium">Completaste todas las fases. Sos un crack.</p>
          {groupTotal > 0 && (
            <div className="flex justify-center gap-3 mt-4 text-xs">
              <span className="text-green-400">{worldcup.group_wins}V</span>
              <span className="text-yellow-400">{worldcup.group_draws}E</span>
              <span className="text-red-400">{worldcup.group_losses}D</span>
              <span className="text-muted-foreground">en grupos</span>
            </div>
          )}
          {duration && (
            <p className="text-xs text-muted-foreground mt-2">Mundial completado en {duration}</p>
          )}
          <p className="text-muted-foreground text-xs mt-3">
            Registrá un partido para arrancar un nuevo mundial
          </p>
        </div>
        <StageBar currentIndex={STAGES.length} eliminated={false} />
      </div>
    )
  }

  const grouped = worldcup.current_stage === 'groups'
  const total = groupTotal
  const remaining = 3 - total

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <p className="text-4xl mb-2">🌍</p>
        <h2 className="text-lg font-bold">Mi Mundial</h2>
        <p className="text-blue-400 font-semibold text-sm mt-0.5">
          {STAGES[currentIndex]?.label}
        </p>
      </div>

      {/* Barra de etapas */}
      <StageBar currentIndex={currentIndex} eliminated={false} />

      {/* Stats de grupos */}
      {grouped && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Fase de grupos — {total}/3 partidos
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatBox value={worldcup.group_wins}   label="Victorias" color="green" />
            <StatBox value={worldcup.group_draws}  label="Empates"   color="blue"  />
            <StatBox value={worldcup.group_losses} label="Derrotas"  color="red"   />
          </div>
          {remaining > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {remaining} partido{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}
            </p>
          )}
          <GroupProgressBar wins={worldcup.group_wins} draws={worldcup.group_draws} losses={worldcup.group_losses} />
        </div>
      )}
    </div>
  )
}

function StageBar({ currentIndex, eliminated }: { currentIndex: number; eliminated: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between relative">
        {/* Línea conectora */}
        <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-border z-0" />
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-green-500 z-0 transition-all duration-500"
          style={{ width: `calc(${Math.max(0, currentIndex) / (STAGES.length - 1) * 100}% - 1.5rem)` }}
        />

        {STAGES.map((stage, i) => {
          const done = i < currentIndex
          const current = i === currentIndex && !eliminated
          const elim = eliminated && i === currentIndex

          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all',
                  done    && 'bg-green-500 border-green-500 text-white',
                  current && 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30 scale-110',
                  elim    && 'bg-red-900 border-red-500 text-red-300',
                  !done && !current && !elim && 'bg-muted border-border text-muted-foreground',
                )}
              >
                {done ? '✓' : stage.emoji}
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                done    && 'text-green-400',
                current && 'text-blue-300',
                elim    && 'text-red-400',
                !done && !current && !elim && 'text-muted-foreground',
              )}>
                {stage.shortLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatBox({ value, label, color }: { value: number; label: string; color: 'green' | 'blue' | 'red' }) {
  const colors = {
    green: 'bg-green-950/60 text-green-400 border-green-800/40',
    blue:  'bg-blue-950/60  text-blue-400  border-blue-800/40',
    red:   'bg-red-950/60   text-red-400   border-red-800/40',
  }
  return (
    <div className={cn('rounded-xl border p-3 text-center', colors[color])}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  )
}

function GroupProgressBar({ wins, draws, losses }: { wins: number; draws: number; losses: number }) {
  const total = wins + draws + losses
  if (total === 0) return null

  const w = (wins / 3) * 100
  const d = (draws / 3) * 100
  const l = (losses / 3) * 100

  return (
    <div className="mt-3 h-2 rounded-full overflow-hidden bg-muted flex">
      <div className="bg-green-500 transition-all" style={{ width: `${w}%` }} />
      <div className="bg-blue-500 transition-all"  style={{ width: `${d}%` }} />
      <div className="bg-red-500 transition-all"   style={{ width: `${l}%` }} />
    </div>
  )
}
