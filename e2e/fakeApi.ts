import type { Page, Route } from '@playwright/test'

const TOTAL = 20

interface FakeSession {
  index: number
  correct: number
  name: string | null
}

interface BoardRow {
  player_name: string
  score: number
  correct_count: number
  id: string
}

/**
 * PROJECT.md Bölüm 6 sözleşmesini taklit eden küçük sahte backend.
 * Doğru seçenek her sorunun ilk seçeneğidir (id = position * 10 + 1).
 */
export async function mockApi(page: Page) {
  const sessions = new Map<string, FakeSession>()
  const board: BoardRow[] = [
    { player_name: 'Zeynep', score: 1900, correct_count: 19, id: 'seed-1' },
    { player_name: 'Mehmet', score: 700, correct_count: 7, id: 'seed-2' },
  ]

  const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  const error = (route: Route, status: number, code: string) =>
    json(route, status, { error: { code, message: code } })

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    const method = request.method()

    if (path === '/categories/') {
      return json(route, 200, [
        {
          id: 1,
          name: 'Yapay Zeka',
          slug: 'yapay-zeka',
          description: 'ML',
          icon: 'brain',
          order: 1,
        },
        { id: 2, name: 'Fizik', slug: 'fizik', description: 'Fizik', icon: 'atom', order: 2 },
      ])
    }

    if (path === '/quiz-sessions/' && method === 'POST') {
      const id = crypto.randomUUID()
      sessions.set(id, { index: 0, correct: 0, name: null })
      const body = request.postDataJSON() as { category: string }
      return json(route, 201, {
        session_id: id,
        category: body.category,
        total_questions: TOTAL,
        time_limit_seconds: 5,
      })
    }

    const match = path.match(/^\/quiz-sessions\/([^/]+)\/([^/]+)\/$/)
    if (match) {
      const sessionId = match[1]!
      const action = match[2]
      const session = sessions.get(sessionId)
      if (!session) return error(route, 404, 'session_not_found')

      if (action === 'current-question' && method === 'GET') {
        if (session.index >= TOTAL) return error(route, 409, 'session_completed')
        const p = session.index
        return json(route, 200, {
          position: p,
          total: TOTAL,
          question_id: 1000 + p,
          text: `Soru ${p + 1} metni?`,
          choices: [1, 2, 3, 4].map((n) => ({ id: p * 10 + n, text: `Seçenek ${n}` })),
          time_limit_seconds: 5,
          served_at: new Date().toISOString(),
          remaining_seconds: 5,
        })
      }

      if (action === 'answers' && method === 'POST') {
        const body = request.postDataJSON() as { question_id: number; choice_id: number | null }
        if (session.index >= TOTAL) return error(route, 409, 'session_completed')
        if (body.question_id !== 1000 + session.index) return error(route, 409, 'question_mismatch')
        const correctId = session.index * 10 + 1
        const isCorrect = body.choice_id === correctId
        if (isCorrect) session.correct += 1
        session.index += 1
        return json(route, 200, {
          is_correct: isCorrect,
          correct_choice_id: correctId,
          points: isCorrect ? 100 : 0,
          is_last: session.index >= TOTAL,
          score_so_far: session.correct * 100,
        })
      }

      if (action === 'result' && method === 'GET') {
        if (session.index < TOTAL) return error(route, 409, 'session_not_completed')
        return json(route, 200, {
          session_id: sessionId,
          category: 'yapay-zeka',
          status: 'completed',
          score: session.correct * 100,
          correct_count: session.correct,
          total_questions: TOTAL,
          max_score: 2000,
          player_name: session.name,
          finished_at: new Date().toISOString(),
        })
      }

      if (action === 'player-name' && method === 'PATCH') {
        if (session.name) return error(route, 409, 'name_already_set')
        const body = request.postDataJSON() as { player_name: string }
        session.name = body.player_name
        board.push({
          player_name: body.player_name,
          score: session.correct * 100,
          correct_count: session.correct,
          id: sessionId,
        })
        return json(route, 200, {
          session_id: sessionId,
          category: 'yapay-zeka',
          player_name: body.player_name,
          score: session.correct * 100,
          correct_count: session.correct,
        })
      }
    }

    if (path === '/leaderboard/') {
      const me = url.searchParams.get('session_id')
      const entries = [...board]
        .sort((a, b) => b.score - a.score)
        .map((e, i) => ({
          rank: i + 1,
          player_name: e.player_name,
          score: e.score,
          correct_count: e.correct_count,
          finished_at: new Date().toISOString(),
          is_me: e.id === me,
        }))
      return json(route, 200, {
        category: 'yapay-zeka',
        entries,
        me: entries.find((e) => e.is_me) ?? null,
      })
    }

    return error(route, 404, 'not_found')
  })
}
