<script setup lang="ts">
import { computed } from 'vue'

export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed'

const props = defineProps<{ text: string; index: number; state: ChoiceState; disabled?: boolean }>()
defineEmits<{ choose: [] }>()

const classes = computed(
  () =>
    ({
      idle: 'border-slate-200 bg-white hover:border-indigo-400',
      selected: 'border-indigo-500 bg-indigo-50',
      correct: 'border-green-500 bg-green-100 text-green-900',
      wrong: 'border-red-500 bg-red-100 text-red-900',
      dimmed: 'border-slate-200 bg-white opacity-50',
    })[props.state],
)
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-base font-medium transition focus-visible:outline-2 focus-visible:outline-indigo-500"
    :class="classes"
    :disabled="disabled"
    :data-state="state"
    data-testid="choice"
    @click="$emit('choose')"
  >
    <span
      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600"
      aria-hidden="true"
    >
      {{ index + 1 }}
    </span>
    <span class="min-w-0 break-words">{{ text }}</span>
  </button>
</template>
