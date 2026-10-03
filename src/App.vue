<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
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
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
