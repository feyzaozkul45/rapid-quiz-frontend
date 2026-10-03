<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { serverWaking } from '@/api/serverStatus'
</script>

<template>
  <div class="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-8">
    <header class="py-4">
      <RouterLink
        :to="{ name: 'home' }"
        class="text-xl font-extrabold tracking-tight text-indigo-600"
      >
        ⚡ {{ $t('app.name') }}
      </RouterLink>
    </header>
    <div
      v-if="serverWaking"
      role="status"
      class="mb-4 rounded-xl bg-amber-50 p-4 text-amber-900"
      data-testid="server-waking"
    >
      <p class="font-semibold">⏳ {{ $t('server.waking') }}</p>
      <p class="text-sm">{{ $t('server.wakingHint') }}</p>
    </div>
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
