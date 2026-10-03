<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getResult, savePlayerName, toApiError, type QuizResult } from '@/api'
import NameForm from '@/components/NameForm.vue'
import { errorMessage } from '@/i18n'
import { useQuizStore } from '@/stores/quizStore'

const props = defineProps<{ sessionId: string }>()

const router = useRouter()
const store = useQuizStore()

const result = ref<QuizResult | null>(null)
const loading = ref(true)
const loadError = ref('')
const nameError = ref('')
const saving = ref(false)
/** İsim penceresi kapandıysa form gösterilmez. */
const nameClosed = ref(false)
const starting = ref(false)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    result.value = await getResult(props.sessionId)
  } catch (e) {
    const apiError = toApiError(e)
    if (apiError.code === 'session_not_completed') {
      await router.replace({ name: 'quiz', params: { sessionId: props.sessionId } })
      return
    }
    loadError.value = errorMessage(apiError.code)
  } finally {
    loading.value = false
  }
}

function openLeaderboard() {
  if (!result.value) return
  router.push({
    name: 'leaderboard',
    params: { category: result.value.category },
    query: { session: props.sessionId },
  })
}

async function saveName(name: string) {
  if (saving.value || !result.value) return
  saving.value = true
  nameError.value = ''
  try {
    const saved = await savePlayerName(props.sessionId, name)
    result.value = { ...result.value, player_name: saved.player_name }
    openLeaderboard()
  } catch (e) {
    const apiError = toApiError(e)
    if (apiError.code === 'name_already_set') {
      await load()
      openLeaderboard()
    } else {
      if (apiError.code === 'name_window_closed') nameClosed.value = true
      nameError.value = errorMessage(apiError.code)
    }
  } finally {
    saving.value = false
  }
}

async function playAgain() {
  if (!result.value || starting.value) return
  starting.value = true
  try {
    const sessionId = await store.start(result.value.category)
    await router.push({ name: 'quiz', params: { sessionId } })
  } catch (e) {
    loadError.value = errorMessage(toApiError(e).code)
  } finally {
    starting.value = false
  }
}

onMounted(load)
</script>

<template>
  <section>
    <p v-if="loading" class="text-slate-500">{{ $t('common.loading') }}</p>

    <div v-if="loadError" role="alert" class="mb-4 rounded-xl bg-red-50 p-4 text-red-700">
      <p>{{ loadError }}</p>
      <RouterLink :to="{ name: 'home' }" class="mt-2 inline-block font-semibold underline">
        {{ $t('common.home') }}
      </RouterLink>
    </div>

    <template v-if="result">
      <h1 class="text-center text-2xl font-extrabold">{{ $t('result.title') }}</h1>

      <div class="my-6 rounded-2xl bg-white p-6 text-center shadow-sm">
        <p class="text-sm text-slate-500">{{ $t('result.score') }}</p>
        <p class="text-5xl font-extrabold text-indigo-600 tabular-nums" data-testid="score">
          {{ result.score }}
          <span class="text-lg font-medium text-slate-400">
            {{ $t('result.outOf', { max: result.max_score }) }}
          </span>
        </p>
        <p class="mt-2 text-lg" data-testid="correct-count">
          {{
            $t('result.correctCount', {
              correct: result.correct_count,
              total: result.total_questions,
            })
          }}
        </p>
      </div>

      <div v-if="result.player_name" class="mb-6 text-center">
        <p class="mb-3">{{ $t('result.nameSaved', { name: result.player_name }) }}</p>
        <button
          type="button"
          class="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700"
          @click="openLeaderboard"
        >
          {{ $t('result.viewLeaderboard') }}
        </button>
      </div>

      <div v-else class="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-3 text-lg font-bold">{{ $t('result.nameTitle') }}</h2>
        <p v-if="nameClosed" role="alert" class="text-red-600">{{ nameError }}</p>
        <NameForm v-else :loading="saving" :server-error="nameError" @submit="saveName" />
      </div>

      <div class="flex gap-3">
        <button
          type="button"
          class="flex-1 rounded-xl border-2 border-indigo-600 px-4 py-3 font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
          :disabled="starting"
          data-testid="play-again"
          @click="playAgain"
        >
          {{ $t('result.playAgain') }}
        </button>
        <RouterLink
          :to="{ name: 'home' }"
          class="flex-1 rounded-xl border-2 border-slate-300 px-4 py-3 text-center font-semibold text-slate-700 hover:bg-slate-100"
        >
          {{ $t('common.home') }}
        </RouterLink>
      </div>
    </template>
  </section>
</template>
