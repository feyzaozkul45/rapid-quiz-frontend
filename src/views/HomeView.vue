<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCategories, toApiError, type Category } from '@/api'
import CategoryCard from '@/components/CategoryCard.vue'
import { errorMessage } from '@/i18n'
import { useQuizStore } from '@/stores/quizStore'

const router = useRouter()
const store = useQuizStore()

const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref('')
const startingSlug = ref<string | null>(null)

async function loadCategories() {
  loading.value = true
  error.value = ''
  try {
    categories.value = [...(await getCategories())].sort((a, b) => a.order - b.order)
  } catch (e) {
    error.value = errorMessage(toApiError(e).code)
  } finally {
    loading.value = false
  }
}

async function startQuiz(slug: string) {
  if (startingSlug.value) return
  startingSlug.value = slug
  error.value = ''
  try {
    const sessionId = await store.start(slug)
    await router.push({ name: 'quiz', params: { sessionId } })
  } catch (e) {
    error.value = errorMessage(toApiError(e).code)
  } finally {
    startingSlug.value = null
  }
}

onMounted(loadCategories)
</script>

<template>
  <section>
    <h1 class="text-2xl font-extrabold">{{ $t('home.title') }}</h1>
    <p class="mt-1 mb-5 text-slate-600">{{ $t('home.subtitle') }}</p>

    <p v-if="loading" class="text-slate-500">{{ $t('common.loading') }}</p>

    <div v-if="error" role="alert" class="mb-4 rounded-xl bg-red-50 p-4 text-red-700">
      <p>{{ error }}</p>
      <button
        v-if="!categories.length"
        type="button"
        class="mt-2 font-semibold underline"
        @click="loadCategories"
      >
        {{ $t('common.retry') }}
      </button>
    </div>

    <p v-if="!loading && !error && !categories.length" class="text-slate-500">
      {{ $t('home.empty') }}
    </p>

    <div class="flex flex-col gap-3">
      <CategoryCard
        v-for="category in categories"
        :key="category.id"
        :category="category"
        :disabled="startingSlug !== null"
        :busy="startingSlug === category.slug"
        @select="startQuiz"
      />
    </div>
  </section>
</template>
