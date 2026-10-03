<script setup lang="ts">
import type { LeaderboardEntry } from '@/api'

defineProps<{ entries: LeaderboardEntry[]; me?: LeaderboardEntry | null }>()
</script>

<template>
  <div>
    <p v-if="!entries.length" class="rounded-xl bg-white p-6 text-center text-slate-500">
      {{ $t('leaderboard.empty') }}
    </p>
    <table v-else class="w-full overflow-hidden rounded-xl bg-white text-sm shadow-sm">
      <thead class="bg-slate-100 text-left text-slate-600">
        <tr>
          <th class="w-12 px-3 py-2">{{ $t('leaderboard.rank') }}</th>
          <th class="px-3 py-2">{{ $t('leaderboard.player') }}</th>
          <th class="px-3 py-2 text-right">{{ $t('leaderboard.score') }}</th>
          <th class="hidden px-3 py-2 text-right sm:table-cell">{{ $t('leaderboard.correct') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="entry in entries"
          :key="entry.rank"
          class="border-t border-slate-100"
          :class="entry.is_me ? 'bg-amber-100 font-semibold' : ''"
          :data-me="entry.is_me"
          data-testid="leaderboard-row"
        >
          <td class="px-3 py-2 tabular-nums">{{ entry.rank }}</td>
          <td class="break-all px-3 py-2">
            {{ entry.player_name }}
            <span v-if="entry.is_me" class="ml-1 rounded bg-amber-300 px-1.5 py-0.5 text-xs">
              {{ $t('leaderboard.you') }}
            </span>
          </td>
          <td class="px-3 py-2 text-right tabular-nums">{{ entry.score }}</td>
          <td class="hidden px-3 py-2 text-right tabular-nums sm:table-cell">
            {{ entry.correct_count }}/20
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Kullanıcı ilk 10'un dışındaysa kendi sırası ayrıca gösterilir. -->
    <div
      v-if="me && !entries.some((e) => e.is_me)"
      class="mt-3 flex items-center justify-between rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold"
      data-testid="leaderboard-me"
    >
      <span>{{ $t('leaderboard.yourRank') }}: #{{ me.rank }} · {{ me.player_name }}</span>
      <span class="tabular-nums">{{ me.score }}</span>
    </div>
  </div>
</template>
