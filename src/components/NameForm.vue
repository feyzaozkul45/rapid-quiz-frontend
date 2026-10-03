<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NAME_MAX, normalizeName, validateName } from '@/utils/playerName'

const props = defineProps<{ loading?: boolean; serverError?: string | null }>()
const emit = defineEmits<{ submit: [name: string] }>()

const { t } = useI18n()
const name = ref('')
const touched = ref(false)

const problem = computed(() => validateName(name.value))
const clientError = computed(() =>
  touched.value && problem.value ? t(`name.${problem.value}`) : '',
)
const error = computed(() => clientError.value || props.serverError || '')

function onSubmit() {
  touched.value = true
  if (problem.value || props.loading) return
  emit('submit', normalizeName(name.value))
}
</script>

<template>
  <form class="flex flex-col gap-3" novalidate @submit.prevent="onSubmit">
    <label for="player-name" class="font-semibold">{{ $t('name.label') }}</label>
    <input
      id="player-name"
      v-model="name"
      type="text"
      autocomplete="nickname"
      :maxlength="NAME_MAX * 2"
      :placeholder="$t('name.placeholder')"
      :aria-invalid="!!error"
      :aria-describedby="error ? 'player-name-error' : 'player-name-hint'"
      class="rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
      data-testid="name-input"
      @blur="touched = true"
    />
    <p v-if="error" id="player-name-error" role="alert" class="text-sm text-red-600">{{ error }}</p>
    <p v-else id="player-name-hint" class="text-sm text-slate-500">{{ $t('name.hint') }}</p>
    <button
      type="submit"
      class="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      :disabled="loading"
      data-testid="name-submit"
    >
      {{ loading ? $t('name.saving') : $t('name.submit') }}
    </button>
  </form>
</template>
