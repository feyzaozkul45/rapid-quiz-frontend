<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import CountdownTimer from '@/components/CountdownTimer.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import { useCountdown } from '@/composables/useCountdown'
import { errorMessage } from '@/i18n'
import { useQuizStore } from '@/stores/quizStore'

const TIME_LIMIT_SECONDS = 5
/** Cevap sonrası doğru/yanlış gösterim süresi; 5 saniyeye dahil değildir (FR-07). */
const FEEDBACK_MS = 1000

const props = defineProps<{ sessionId: string }>()

const { t } = useI18n()
const router = useRouter()
const store = useQuizStore()

// Başka bir oturumdan kalan soru bir an bile görünmesin.
if (store.sessionId !== props.sessionId) store.reset()

let feedbackTimer: ReturnType<typeof setTimeout> | null = null
let leaving = false

const countdown = useCountdown(TIME_LIMIT_SECONDS, () => submit(null))

const feedbackText = computed(() => {
  const feedback = store.feedback
  if (!feedback) return ''
  if (store.selectedChoiceId === null) return t('quiz.timeUp')
  if (feedback.too_fast) return t('quiz.tooFast')
  return feedback.is_correct ? t('quiz.correct') : t('quiz.wrong')
})

function afterLoad() {
  if (store.phase === 'question' && store.question) {
    countdown.start(store.question.remaining_seconds)
  } else if (store.phase === 'finished') {
    finish()
  }
}

function finish() {
  leaving = true
  router.replace({ name: 'result', params: { sessionId: props.sessionId } })
}

async function submit(choiceId: number | null) {
  if (!store.canAnswer) return
  countdown.stop()
  await store.answer(choiceId)
  if (store.phase === 'feedback') {
    feedbackTimer = setTimeout(advance, FEEDBACK_MS)
  } else {
    afterLoad()
  }
}

async function advance() {
  feedbackTimer = null
  await store.next()
  afterLoad()
}

async function load() {
  await store.load(props.sessionId)
  afterLoad()
}

/** 1–4 tuşlarıyla seçim. */
function onKey(event: KeyboardEvent) {
  const choice = store.question?.choices[Number(event.key) - 1]
  if (choice) submit(choice.id)
}

// Quiz sırasında geri tuşu/ana sayfa bağlantısı onay ister; önceki soruya dönüş yoktur.
onBeforeRouteLeave(() => {
  if (leaving || store.phase === 'finished' || store.phase === 'error') return true
  return window.confirm(t('quiz.leaveConfirm'))
})

onMounted(() => {
  window.addEventListener('keydown', onKey)
  load()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (feedbackTimer) clearTimeout(feedbackTimer)
  countdown.stop()
})
</script>

<template>
  <section>
    <div
      v-if="store.phase === 'error' && store.error"
      role="alert"
      class="rounded-xl bg-red-50 p-4"
    >
      <p class="text-red-700">{{ errorMessage(store.error.code) }}</p>
      <div class="mt-3 flex gap-4">
        <button
          v-if="store.error.code === 'network_error'"
          type="button"
          class="font-semibold underline"
          @click="load"
        >
          {{ $t('common.retry') }}
        </button>
        <RouterLink :to="{ name: 'home' }" class="font-semibold underline">
          {{ $t('common.home') }}
        </RouterLink>
      </div>
    </div>

    <template v-else-if="store.question">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <p class="text-lg font-bold" data-testid="progress">
            {{
              $t('quiz.question', {
                current: store.question.position + 1,
                total: store.question.total,
              })
            }}
          </p>
          <p class="text-sm text-slate-500">{{ $t('quiz.score', { score: store.score }) }}</p>
        </div>
        <CountdownTimer
          :seconds="countdown.displaySeconds.value"
          :progress="countdown.progress.value"
        />
      </div>

      <QuestionCard
        :question="store.question"
        :selected-choice-id="store.selectedChoiceId"
        :feedback="store.feedback"
        :locked="!store.canAnswer"
        @choose="submit"
      />

      <p
        class="mt-4 h-6 text-center font-semibold"
        :class="store.feedback?.is_correct ? 'text-green-600' : 'text-red-600'"
        aria-live="polite"
        data-testid="feedback"
      >
        {{ feedbackText }}
      </p>
    </template>

    <p v-else class="text-slate-500">{{ $t('common.loading') }}</p>
  </section>
</template>
