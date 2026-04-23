export type WorldcupStatus = 'active' | 'eliminated' | 'completed'
export type WorldcupStage = 'groups' | 'round_of_16' | 'quarterfinals' | 'semifinals' | 'final'
export type MatchResult = 'win' | 'lose' | 'draw'

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

export interface Match {
  id: string
  user_id: string
  result: MatchResult
  counts_for_worldcup: boolean
  created_at: string
}

export interface Group {
  id: string
  name: string
  created_by: string
  code: string
  created_at: string
  member_count?: number
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
}

export interface Profile {
  id: string
  email: string
  username: string | null
  full_name: string | null
}
