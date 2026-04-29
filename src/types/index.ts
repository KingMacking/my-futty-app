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
  ended_at: string | null
}

export interface Match {
  id: string
  user_id: string
  result: MatchResult
  counts_for_worldcup: boolean
  goals: number | null
  assists: number | null
  replay_url: string | null
  played_at: string
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

export type GroupMemberRole = 'member' | 'admin'

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
  role: GroupMemberRole
}

export interface GroupMatch {
  id: string
  group_id: string
  team_a_score: number
  team_b_score: number
  replay_url: string | null
  played_at: string
  created_by: string
  created_at: string
}

export interface GroupMatchPlayer {
  id: string
  group_match_id: string
  user_id: string | null
  guest_name: string | null
  team: 'a' | 'b'
  goals: number
  assists: number
}

export interface Profile {
  id: string
  email: string
  username: string | null
  full_name: string | null
}
