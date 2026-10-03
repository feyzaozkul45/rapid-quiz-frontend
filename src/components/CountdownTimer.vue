<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ seconds: number; progress: number }>()

const RADIUS = 44
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const dashOffset = computed(() => CIRCUMFERENCE * (1 - Math.min(Math.max(props.progress, 0), 1)))
const urgent = computed(() => props.seconds <= 2)
</script>

<template>
  <div
    class="relative h-24 w-24"
    role="timer"
    :aria-label="$t('quiz.secondsLeft', { n: seconds })"
    data-testid="countdown"
  >
    <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
      <circle cx="50" cy="50" :r="RADIUS" fill="none" stroke-width="8" class="stroke-slate-200" />
      <circle
        cx="50"
        cy="50"
        :r="RADIUS"
        fill="none"
        stroke-width="8"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dashOffset"
        :class="urgent ? 'stroke-red-500' : 'stroke-indigo-500'"
        data-testid="countdown-ring"
      />
    </svg>
    <span
      class="absolute inset-0 flex items-center justify-center text-3xl font-bold tabular-nums"
      :class="urgent ? 'text-red-600' : 'text-slate-800'"
      data-testid="countdown-seconds"
    >
      {{ seconds }}
    </span>
  </div>
</template>
