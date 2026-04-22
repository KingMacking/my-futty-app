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
      <div className="worldcup-card eliminated">
        <h2>😢 Eliminado</h2>
        <p>Quedaste eliminado en <strong>{STAGE_LABELS[worldcup.current_stage]}</strong></p>
        <p className="hint">Registrá un nuevo partido para iniciar un nuevo mundial</p>
      </div>
    )
  }

  if (worldcup.status === 'completed') {
    return (
      <div className="worldcup-card completed">
        <h2>🏆 Campeón del Mundo</h2>
        <p>Completaste el mundial. ¡Sos un crack!</p>
      </div>
    )
  }

  return (
    <div className="worldcup-card">
      <h2>🌍 Mi Mundial</h2>
      <p className="stage-label">{STAGE_LABELS[worldcup.current_stage]}</p>

      {worldcup.current_stage === 'groups' && (
        <div className="group-stats">
          <span className="stat win">✅ {worldcup.group_wins}V</span>
          <span className="stat draw">🤝 {worldcup.group_draws}E</span>
          <span className="stat loss">❌ {worldcup.group_losses}D</span>
        </div>
      )}

      <div className="stage-path">
        {STAGE_ORDER.map((stage, i) => (
          <div
            key={stage}
            className={`stage-step ${i < currentIndex ? 'done' : ''} ${i === currentIndex ? 'current' : ''}`}
          >
            {STAGE_LABELS[stage]}
          </div>
        ))}
      </div>
    </div>
  )
}
