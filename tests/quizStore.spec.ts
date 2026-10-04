import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, type AnswerResult, type Question } from '@/api'
import { useQuizStore } from '@/stores/quizStore'

const api = vi.hoisted(() => ({
  createSession: vi.fn(),
  getCurrentQuestion: vi.fn(),
  submitAnswer: vi.fn(),
}))

vi.mock('@/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}))

function question(position: number): Question {
  return {
    position,
    total: 20,
    question_id: 100 + position,
    text: `Soru ${position}`,
    choices: [1, 2, 3, 4].map((n) => ({ id: position * 10 + n, text: `Seçenek ${n}` })),
    time_limit_seconds: 5,
    served_at: '2026-10-01T10:00:00Z',
    remaining_seconds: 5,
  }
}

function answerResult(overrides: Partial<AnswerResult> = {}): AnswerResult {
  return {
    is_correct: true,
    correct_choice_id: 1,
    points: 100,
    is_last: false,
    score_so_far: 100,
    ...overrides,
  }
}

describe('quizStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('tekrar önleme (son oynanan sorular)', () => {
    it('start, kategorinin son oynanan soru ID’lerini sunucuya gönderir', async () => {
      localStorage.setItem('rq:recent:fizik', JSON.stringify([5, 6, 7]))
      localStorage.setItem('rq:recent:yazilim', JSON.stringify([99]))
      api.createSession.mockResolvedValue({ session_id: 's1', category: 'fizik' })

      await useQuizStore().start('fizik')

      expect(api.createSession).toHaveBeenCalledWith('fizik', [5, 6, 7])
    })

    it('gösterilen her soru kategoriye göre hatırlanır', async () => {
      api.createSession.mockResolvedValue({ session_id: 's1', category: 'fizik' })
      api.getCurrentQuestion.mockResolvedValueOnce(question(0)).mockResolvedValueOnce(question(1))
      api.submitAnswer.mockResolvedValue(answerResult())
      const store = useQuizStore()
      await store.start('fizik')
      await store.load('s1')
      await store.answer(1)
      await store.next()

      expect(JSON.parse(localStorage.getItem('rq:recent:fizik')!)).toEqual([100, 101])
      expect(localStorage.getItem('rq:recent:yazilim')).toBeNull()
    })

    it('sayfa yenilenince (store boşken) kategori oturumdan bulunur', async () => {
      api.createSession.mockResolvedValue({ session_id: 's1', category: 'fizik' })
      await useQuizStore().start('fizik')

      setActivePinia(createPinia()) // yenileme: yeni, boş store
      api.getCurrentQuestion.mockResolvedValue(question(3))
      await useQuizStore().load('s1')

      expect(JSON.parse(localStorage.getItem('rq:recent:fizik')!)).toEqual([103])
    })

    it('kategorisi bilinmeyen oturumda hiçbir şey yazılmaz', async () => {
      api.getCurrentQuestion.mockResolvedValue(question(0))
      await useQuizStore().load('bilinmeyen')
      expect(localStorage.length).toBe(0)
    })
  })

  it('start oturumu açar ve id döner', async () => {
    api.createSession.mockResolvedValue({ session_id: 's1', category: 'fizik' })
    const store = useQuizStore()

    expect(await store.start('fizik')).toBe('s1')
    expect(store.sessionId).toBe('s1')
    expect(store.category).toBe('fizik')
    expect(api.createSession).toHaveBeenCalledWith('fizik', [])
  })

  it('load soruyu getirir ve question aşamasına geçer', async () => {
    api.getCurrentQuestion.mockResolvedValue(question(0))
    const store = useQuizStore()

    await store.load('s1')

    expect(store.phase).toBe('question')
    expect(store.question?.question_id).toBe(100)
    expect(store.canAnswer).toBe(true)
  })

  it('cevap gönderilince geri bildirim aşamasına geçer, puanı günceller ve kilitlenir', async () => {
    api.getCurrentQuestion.mockResolvedValue(question(0))
    api.submitAnswer.mockResolvedValue(answerResult({ score_so_far: 300 }))
    const store = useQuizStore()
    await store.load('s1')

    await store.answer(2)

    expect(api.submitAnswer).toHaveBeenCalledWith('s1', 100, 2)
    expect(store.phase).toBe('feedback')
    expect(store.score).toBe(300)
    expect(store.selectedChoiceId).toBe(2)
    expect(store.canAnswer).toBe(false)
  })

  it('ilk tıklamada kilitlenir: ikinci cevap gönderilmez', async () => {
    api.getCurrentQuestion.mockResolvedValue(question(0))
    let resolve!: (value: AnswerResult) => void
    api.submitAnswer.mockReturnValue(new Promise<AnswerResult>((r) => (resolve = r)))
    const store = useQuizStore()
    await store.load('s1')

    const first = store.answer(1)
    await store.answer(2)
    resolve(answerResult())
    await first

    expect(api.submitAnswer).toHaveBeenCalledTimes(1)
    expect(store.selectedChoiceId).toBe(1)
  })

  it('süre dolunca choice_id null gönderilir', async () => {
    api.getCurrentQuestion.mockResolvedValue(question(0))
    api.submitAnswer.mockResolvedValue(answerResult({ is_correct: false, points: 0 }))
    const store = useQuizStore()
    await store.load('s1')

    await store.answer(null)

    expect(api.submitAnswer).toHaveBeenCalledWith('s1', 100, null)
    expect(store.selectedChoiceId).toBeNull()
  })

  it('next sıradaki soruyu yükler ve önceki geri bildirimi temizler', async () => {
    api.getCurrentQuestion.mockResolvedValueOnce(question(0)).mockResolvedValueOnce(question(1))
    api.submitAnswer.mockResolvedValue(answerResult())
    const store = useQuizStore()
    await store.load('s1')
    await store.answer(1)

    await store.next()

    expect(store.phase).toBe('question')
    expect(store.question?.position).toBe(1)
    expect(store.feedback).toBeNull()
    expect(store.selectedChoiceId).toBeNull()
  })

  it('son sorudan sonra next quiz’i bitirir, yeni soru istemez', async () => {
    api.getCurrentQuestion.mockResolvedValue(question(19))
    api.submitAnswer.mockResolvedValue(answerResult({ is_last: true }))
    const store = useQuizStore()
    await store.load('s1')
    await store.answer(1)

    await store.next()

    expect(store.phase).toBe('finished')
    expect(api.getCurrentQuestion).toHaveBeenCalledTimes(1)
  })

  it('question_mismatch alınırsa sunucuyla yeniden senkronlanır', async () => {
    api.getCurrentQuestion.mockResolvedValueOnce(question(0)).mockResolvedValueOnce(question(1))
    api.submitAnswer.mockRejectedValue(new ApiError('question_mismatch', 'x', 409))
    const store = useQuizStore()
    await store.load('s1')

    await store.answer(1)

    expect(store.phase).toBe('question')
    expect(store.question?.position).toBe(1)
  })

  it('load sırasında session_completed gelirse finished olur', async () => {
    api.getCurrentQuestion.mockRejectedValue(new ApiError('session_completed', 'x', 409))
    const store = useQuizStore()

    await store.load('s1')

    expect(store.phase).toBe('finished')
  })

  it('session_expired hatası error aşamasına geçirir', async () => {
    api.getCurrentQuestion.mockRejectedValue(new ApiError('session_expired', 'x', 410))
    const store = useQuizStore()

    await store.load('s1')

    expect(store.phase).toBe('error')
    expect(store.error?.code).toBe('session_expired')
  })

  it('farklı oturum yüklenince eski durum sıfırlanır', async () => {
    api.getCurrentQuestion
      .mockResolvedValueOnce(question(5))
      .mockRejectedValueOnce(new ApiError('network_error', 'x'))
    api.submitAnswer.mockResolvedValue(answerResult({ score_so_far: 500 }))
    const store = useQuizStore()
    await store.load('s1')
    await store.answer(1)

    await store.load('s2')

    expect(store.sessionId).toBe('s2')
    expect(store.score).toBe(0)
  })
})
