/** Ordered list of worldcup stages */
export const STAGE_LIST = [
  'groups',
  'round_of_16',
  'quarterfinals',
  'semifinals',
  'final',
] as const

export type Stage = (typeof STAGE_LIST)[number]

/** Full display names for each stage */
export const STAGE_LABELS: Record<string, string> = {
  groups:        'Fase de Grupos',
  round_of_16:   'Octavos de Final',
  quarterfinals: 'Cuartos de Final',
  semifinals:    'Semifinal',
  final:         'Final',
}

/** Short display names for each stage */
export const STAGE_LABELS_SHORT: Record<string, string> = {
  groups:        'Grupos',
  round_of_16:   'Octavos',
  quarterfinals: 'Cuartos',
  semifinals:    'Semis',
  final:         'Final',
}

/** Numeric weight for each stage — use for ordering and comparing progression */
export const STAGE_ORDER: Record<string, number> = {
  groups:        1,
  round_of_16:   2,
  quarterfinals: 3,
  semifinals:    4,
  final:         5,
}

/** Visual style per match result — icon + Tailwind class string */
export const RESULT_STYLE: Record<string, { icon: string; className: string }> = {
  win:  { icon: 'V', className: 'text-green-400 bg-green-950/50 border-green-800/40' },
  draw: { icon: 'E', className: 'text-yellow-400 bg-yellow-950/50 border-yellow-800/40' },
  lose: { icon: 'D', className: 'text-red-400 bg-red-950/50 border-red-800/40' },
}
