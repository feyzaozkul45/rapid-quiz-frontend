import { http } from './client'
import type {
  AnswerResult,
  Category,
  Leaderboard,
  PlayerNameResult,
  Question,
  QuizResult,
  SessionCreated,
} from './types'

/**
 * URL yolunun tek bir parçası olarak güvenli biçimde kodlar. Oturum ID'si adres çubuğundan
 * (`/quiz/:sessionId`) geldiği için `../` veya `?` içerebilir; kodlanmazsa API içinde başka bir
 * yola istek atılabilirdi.
 */
const segment = encodeURIComponent

export async function getCategories(): Promise<Category[]> {
  return (await http.get<Category[]>('/categories/')).data
}

/** `recentQuestionIds`: bu kategoride son oynanan soru ID'leri (eskiden yeniye, en fazla 40). */
export async function createSession(
  category: string,
  recentQuestionIds: number[] = [],
): Promise<SessionCreated> {
  return (
    await http.post<SessionCreated>('/quiz-sessions/', {
      category,
      client_type: 'web',
      recent_question_ids: recentQuestionIds,
    })
  ).data
}

export async function getCurrentQuestion(sessionId: string): Promise<Question> {
  return (await http.get<Question>(`/quiz-sessions/${segment(sessionId)}/current-question/`)).data
}

/** Süre dolduysa `choiceId` null gönderilir. */
export async function submitAnswer(
  sessionId: string,
  questionId: number,
  choiceId: number | null,
): Promise<AnswerResult> {
  return (
    await http.post<AnswerResult>(`/quiz-sessions/${segment(sessionId)}/answers/`, {
      question_id: questionId,
      choice_id: choiceId,
    })
  ).data
}

export async function getResult(sessionId: string): Promise<QuizResult> {
  return (await http.get<QuizResult>(`/quiz-sessions/${segment(sessionId)}/result/`)).data
}

export async function savePlayerName(
  sessionId: string,
  playerName: string,
): Promise<PlayerNameResult> {
  return (
    await http.patch<PlayerNameResult>(`/quiz-sessions/${segment(sessionId)}/player-name/`, {
      player_name: playerName,
    })
  ).data
}

export async function getLeaderboard(
  category: string,
  options: { limit?: number; sessionId?: string } = {},
): Promise<Leaderboard> {
  const params: Record<string, string | number> = { category, limit: options.limit ?? 10 }
  if (options.sessionId) params.session_id = options.sessionId
  return (await http.get<Leaderboard>('/leaderboard/', { params })).data
}
