export type WorldcupStatus = 'active' | 'eliminated' | 'completed'
export type WorldcupStage = 'groups' | 'round_of_16' | 'quarterfinals' | 'semifinals' | 'final'

export interface Worldcup {
  id: string
  user_id: string
  current_stage: WorldcupStage
  group_wins: number
  group_draws: number
  group_losses: number
  status: WorldcupStatus
  created_at: string
}
