import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  ApiError,
  createSession,
  getCurrentQuestion,
  submitAnswer,
  toApiError,
  type AnswerResult,
  type Question,
} from '@/api'
import {
  categoryOfSession,
  getRecentQuestionIds,
  rememberQuestion,
  rememberSessionCategory,
} from '@/utils/recentQuestions'

export type QuizPhase = 'idle' | 'loading' | 'question' | 'feedback' | 'finished' | 'error'

export const useQuizStore = defineStore('quiz', () => {
  const sessionId = ref<string | null>(null)
  const category = ref<string | null>(null)
  const question = ref<Question | null>(null)
  const phase = ref<QuizPhase>('idle')
  const selectedChoiceId = ref<number | null>(null)
  const feedback = ref<AnswerResult | null>(null)
  const score = ref(0)
  const submitting = ref(false)
  const error = ref<ApiError | null>(null)

  const canAnswer = computed(() => phase.value === 'question' && !submitting.value)

  function reset() {
    sessionId.value = null
    category.value = null
    question.value = null
    phase.value = 'idle'
    selectedChoiceId.value = null
    feedback.value = null
    score.value = 0
    submitting.value = false
    error.value = null
  }

  function fail(e: unknown) {
    error.value = toApiError(e)
    phase.value = 'error'
  }

  /** Yeni oturum açar; başarısız olursa hatayı fırlatır (çağıran ekran gösterir). */
  async function start(categorySlug: string): Promise<string> {
    reset()
    const session = await createSession(categorySlug, getRecentQuestionIds(categorySlug))
    sessionId.value = session.session_id
    category.value = session.category
    rememberSessionCategory(session.session_id, session.category)
    return session.session_id
  }

  /** Sıradaki soruyu sunucudan alır. Sayfa yenilenince de aynı soru kalan süresiyle gelir. */
  async function load(id: string) {
    if (sessionId.value !== id) {
      reset()
      sessionId.value = id
    }
    phase.value = 'loading'
    error.value = null
    submitting.value = false
    try {
      // Önceki sorunun renkleri yeni soru gelene kadar ekranda kalır (titreme olmasın).
      question.value = await getCurrentQuestion(id)
      // Sayfa yenilenince kategori store'da yoktur; oturumdan hatırlanır.
      category.value ??= categoryOfSession(id)
      if (category.value) rememberQuestion(category.value, question.value.question_id)
      selectedChoiceId.value = null
      feedback.value = null
      phase.value = 'question'
    } catch (e) {
      const apiError = toApiError(e)
      if (apiError.code === 'session_completed') {
        phase.value = 'finished'
      } else {
        fail(apiError)
      }
    }
  }

  /** Cevabı gönderir; süre dolduysa `choiceId` null olmalıdır. İlk çağrıda kilitlenir. */
  async function answer(choiceId: number | null) {
    if (!canAnswer.value || !sessionId.value || !question.value) return
    submitting.value = true
    selectedChoiceId.value = choiceId
    try {
      feedback.value = await submitAnswer(sessionId.value, question.value.question_id, choiceId)
      score.value = feedback.value.score_so_far
      phase.value = 'feedback'
    } catch (e) {
      const apiError = toApiError(e)
      if (apiError.code === 'question_mismatch' || apiError.code === 'question_not_served') {
        // Sunucu soruyu zaten kapatmış (ör. süre aşımı): sıradaki duruma senkronlan.
        await load(sessionId.value)
      } else if (apiError.code === 'session_completed') {
        phase.value = 'finished'
      } else {
        fail(apiError)
      }
    } finally {
      submitting.value = false
    }
  }

  /** Geri bildirim sonrası: son soruysa bitir, değilse sıradakini iste. */
  async function next() {
    if (phase.value !== 'feedback' || !sessionId.value) return
    if (feedback.value?.is_last) {
      phase.value = 'finished'
      return
    }
    await load(sessionId.value)
  }

  return {
    sessionId,
    category,
    question,
    phase,
    selectedChoiceId,
    feedback,
    score,
    submitting,
    error,
    canAnswer,
    reset,
    start,
    load,
    answer,
    next,
  }
})
