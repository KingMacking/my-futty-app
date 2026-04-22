import type { Worldcup, WorldcupStage, MatchResult } from '../types'

export type WorldcupTransition =
  | { type: 'advance'; nextStage: WorldcupStage }
  | { type: 'completed' }
  | { type: 'eliminated' }
  | { type: 'coin_flip' }
  | { type: 'continue' }

const NEXT_STAGE: Record<WorldcupStage, WorldcupStage | null> = {
  groups:         'round_of_16',
  round_of_16:    'quarterfinals',
  quarterfinals:  'semifinals',
  semifinals:     'final',
  final:          null,
}

export function getNextStage(stage: WorldcupStage): WorldcupStage | null {
  return NEXT_STAGE[stage]
}

/**
 * Calcula la transición del mundial dado un resultado.
 * Pura — no toca la DB.
 */
export function calcTransition(worldcup: Worldcup, result: MatchResult): WorldcupTransition {
  if (worldcup.current_stage === 'groups') {
    return calcGroupsTransition(worldcup, result)
  }
  return calcEliminationTransition(worldcup, result)
}

function calcGroupsTransition(worldcup: Worldcup, result: MatchResult): WorldcupTransition {
  const wins   = worldcup.group_wins   + (result === 'win'  ? 1 : 0)
  const draws  = worldcup.group_draws  + (result === 'draw' ? 1 : 0)
  const losses = worldcup.group_losses + (result === 'lose' ? 1 : 0)
  const total  = wins + draws + losses
  const remaining = 3 - total

  // 2 victorias → clasificado
  if (wins >= 2) return { type: 'advance', nextStage: 'round_of_16' }

  // 3 partidos jugados → evaluar
  if (total === 3) {
    if (wins === 1 && draws === 1 && losses === 1) return { type: 'coin_flip' }
    return { type: 'eliminated' }
  }

  // Eliminación temprana: ya imposible llegar a 2V o 1V1E1D
  const maxPossibleWins = wins + remaining
  if (maxPossibleWins < 2) {
    // ¿Puede todavía llegar a 1V1E1D?
    const canReach1W1D1L =
      wins === 0 &&
      ((draws === 1 && losses === 1) || // 1 partido restante: falta ganar
       (draws === 0 && losses === 1 && remaining === 2) ||
       (draws === 1 && losses === 0 && remaining === 2))

    if (!canReach1W1D1L) return { type: 'eliminated' }
  }

  return { type: 'continue' }
}

function calcEliminationTransition(worldcup: Worldcup, result: MatchResult): WorldcupTransition {
  if (result === 'lose') return { type: 'eliminated' }
  if (result === 'draw') return { type: 'coin_flip' }

  // win → avanzar
  const next = getNextStage(worldcup.current_stage)
  if (!next) return { type: 'completed' }
  return { type: 'advance', nextStage: next }
}

/**
 * Devuelve los campos a actualizar en la DB según la transición.
 */
export function buildWorldcupUpdate(
  worldcup: Worldcup,
  result: MatchResult,
  transition: WorldcupTransition,
): Partial<Worldcup> {
  const statsUpdate = worldcup.current_stage === 'groups'
    ? {
        group_wins:   worldcup.group_wins   + (result === 'win'  ? 1 : 0),
        group_draws:  worldcup.group_draws  + (result === 'draw' ? 1 : 0),
        group_losses: worldcup.group_losses + (result === 'lose' ? 1 : 0),
      }
    : {}

  switch (transition.type) {
    case 'advance':
      return { ...statsUpdate, current_stage: transition.nextStage }
    case 'completed':
      return { ...statsUpdate, status: 'completed' }
    case 'eliminated':
      return { ...statsUpdate, status: 'eliminated' }
    case 'coin_flip':
    case 'continue':
      return statsUpdate
  }
}
