<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '@/api'

const props = defineProps<{ category: Category; disabled?: boolean; busy?: boolean }>()
defineEmits<{ select: [slug: string] }>()

const ICONS: Record<string, string> = {
  brain: '🧠',
  cpu: '💻',
  globe: '🌍',
  atom: '⚛️',
  code: '👨‍💻',
}
const icon = computed(() => ICONS[props.category.icon ?? ''] ?? '❓')
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-400 hover:shadow focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-60"
    :disabled="disabled"
    :data-testid="`category-${category.slug}`"
    @click="$emit('select', category.slug)"
  >
    <span class="text-3xl" aria-hidden="true">{{ busy ? '⏳' : icon }}</span>
    <span class="min-w-0">
      <span class="block font-semibold">{{ category.name }}</span>
      <span v-if="category.description" class="block text-sm text-slate-500">
        {{ category.description }}
      </span>
    </span>
  </button>
</template>
