import { cn } from '@/lib/utils'
import type { Worldcup } from '../types'

const STAGE_LABELS: Record<string, string> = {
  groups: 'Fase de Grupos',
  round_of_16: 'Octavos de Final',
  quarterfinals: 'Cuartos de Final',
  semifinals: 'Semifinal',
  final: 'Final',
}

const STAGE_ORDER = ['groups', 'round_of_16', 'quarterfinals', 'semifinals', 'final']

interface Props {
  worldcup: Worldcup
}

export function WorldcupPath({ worldcup }: Props) {
  const currentIndex = STAGE_ORDER.indexOf(worldcup.current_stage)

  if (worldcup.status === 'eliminated') {
    return (
      <div className="rounded-xl border border-red-500/30 bg-card p-6 text-center">
        <p className="text-4xl mb-3">😢</p>
        <h2 className="text-xl font-semibold mb-1">Eliminado</h2>
        <p className="text-foreground text-sm">
          Quedaste en <span className="font-semibold">{STAGE_LABELS[worldcup.current_stage]}</span>
        </p>
        <p className="text-muted-foreground text-xs mt-2">Registrá un partido para iniciar un nuevo mundial</p>
      </div>
    )
  }

  if (worldcup.status === 'completed') {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-card p-6 text-center">
        <p className="text-4xl mb-3">🏆</p>
        <h2 className="text-xl font-semibold mb-1">Campeón del Mundo</h2>
        <p className="text-muted-foreground text-sm">¡Completaste el mundial. Sos un crack!</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-center mb-5">
        <p className="text-3xl mb-1">🌍</p>
        <h2 className="text-lg font-semibold">Mi Mundial</h2>
        <p className="text-green-400 font-semibold mt-0.5">{STAGE_LABELS[worldcup.current_stage]}</p>
      </div>

      {worldcup.current_stage === 'groups' && (
        <div className="flex justify-center gap-2 mb-5">
          <span className="bg-green-950 text-green-400 font-bold px-3 py-1 rounded-full text-sm">✅ {worldcup.group_wins}V</span>
          <span className="bg-blue-950 text-blue-400 font-bold px-3 py-1 rounded-full text-sm">🤝 {worldcup.group_draws}E</span>
          <span className="bg-red-950 text-red-400 font-bold px-3 py-1 rounded-full text-sm">❌ {worldcup.group_losses}D</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {STAGE_ORDER.map((stage, i) => (
          <div
            key={stage}
            className={cn(
              'px-3 py-2 rounded-lg text-sm border text-center transition-colors',
              i < currentIndex && 'bg-green-950/50 text-green-400 border-green-800/50',
              i === currentIndex && 'bg-blue-950/50 text-blue-300 border-blue-800/50 font-semibold',
              i > currentIndex && 'bg-muted/30 text-muted-foreground border-transparent',
            )}
          >
            {i < currentIndex && '✓ '}{STAGE_LABELS[stage]}
          </div>
        ))}
      </div>
    </div>
  )
}
