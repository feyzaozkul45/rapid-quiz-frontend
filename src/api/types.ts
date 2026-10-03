export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  order: number
}

export interface SessionCreated {
  session_id: string
  category: string
  total_questions: number
  time_limit_seconds: number
}

export interface Choice {
  id: number
  text: string
}

export interface Question {
  /** 0 tabanlı sıra */
  position: number
  total: number
  question_id: number
  text: string
  choices: Choice[]
  time_limit_seconds: number
  served_at: string
  remaining_seconds: number
}

export interface AnswerResult {
  is_correct: boolean
  correct_choice_id: number | null
  points: number
  is_last: boolean
  score_so_far: number
}

export interface QuizResult {
  session_id: string
  category: string
  status: string
  score: number
  correct_count: number
  total_questions: number
  max_score: number
  player_name: string | null
  finished_at: string | null
}

export interface PlayerNameResult {
  session_id: string
  category: string
  player_name: string
  score: number
  correct_count: number
}

export interface LeaderboardEntry {
  rank: number
  player_name: string
  score: number
  correct_count: number
  finished_at: string
  is_me: boolean
}

export interface Leaderboard {
  category: string
  entries: LeaderboardEntry[]
  /** Yalnızca `session_id` verildiyse bulunur; oturum tabloda yoksa null. */
  me?: LeaderboardEntry | null
}
