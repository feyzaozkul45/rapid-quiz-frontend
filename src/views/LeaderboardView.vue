<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCategories, getLeaderboard, toApiError, type Leaderboard } from '@/api'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import { errorMessage } from '@/i18n'
import { useQuizStore } from '@/stores/quizStore'

const props = defineProps<{ category: string; sessionId?: string }>()

const router = useRouter()
const store = useQuizStore()

const board = ref<Leaderboard | null>(null)
const categoryName = ref(props.category)
const loading = ref(true)
const error = ref('')
const starting = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    board.value = await getLeaderboard(props.category, { limit: 10, sessionId: props.sessionId })
    // Başlıkta okunaklı kategori adı; alınamazsa slug ile devam edilir.
    getCategories()
      .then((list) => {
        categoryName.value = list.find((c) => c.slug === props.category)?.name ?? props.category
      })
      .catch(() => {})
  } catch (e) {
    error.value = errorMessage(toApiError(e).code)
  } finally {
    loading.value = false
  }
}

async function playAgain() {
  if (starting.value) return
  starting.value = true
  try {
    const sessionId = await store.start(props.category)
    await router.push({ name: 'quiz', params: { sessionId } })
  } catch (e) {
    error.value = errorMessage(toApiError(e).code)
  } finally {
    starting.value = false
  }
}

onMounted(load)
</script>

<template>
  <section>
    <h1 class="mb-4 text-2xl font-extrabold">
      {{ $t('leaderboard.title', { category: categoryName }) }}
    </h1>

    <p v-if="loading" class="text-slate-500">{{ $t('common.loading') }}</p>

    <div v-if="error" role="alert" class="mb-4 rounded-xl bg-red-50 p-4 text-red-700">
      <p>{{ error }}</p>
      <button type="button" class="mt-2 font-semibold underline" @click="load">
        {{ $t('common.retry') }}
      </button>
    </div>

    <LeaderboardTable v-if="board" :entries="board.entries" :me="board.me" />

    <div class="mt-6 flex gap-3">
      <button
        type="button"
        class="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
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
  </section>
</template>
