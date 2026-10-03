<script setup lang="ts">
import { computed } from 'vue'
import type { AnswerResult, Question } from '@/api'
import ChoiceButton, { type ChoiceState } from './ChoiceButton.vue'

const props = defineProps<{
  question: Question
  selectedChoiceId: number | null
  feedback: AnswerResult | null
  locked: boolean
}>()
const emit = defineEmits<{ choose: [choiceId: number] }>()

function stateOf(choiceId: number): ChoiceState {
  const feedback = props.feedback
  if (!feedback) return props.selectedChoiceId === choiceId ? 'selected' : 'idle'
  if (choiceId === feedback.correct_choice_id) return 'correct'
  if (choiceId === props.selectedChoiceId) return 'wrong'
  return 'dimmed'
}

const states = computed(() => props.question.choices.map((c) => stateOf(c.id)))
</script>

<template>
  <section>
    <h2 class="mb-5 text-xl font-semibold leading-snug" data-testid="question-text">
      {{ question.text }}
    </h2>
    <div class="flex flex-col gap-3">
      <ChoiceButton
        v-for="(choice, i) in question.choices"
        :key="choice.id"
        :text="choice.text"
        :index="i"
        :state="states[i]!"
        :disabled="locked"
        @choose="emit('choose', choice.id)"
      />
    </div>
  </section>
</template>
