import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/quiz/:sessionId',
      name: 'quiz',
      component: () => import('@/views/QuizView.vue'),
      props: true,
    },
    {
      path: '/result/:sessionId',
      name: 'result',
      component: () => import('@/views/ResultView.vue'),
      props: true,
    },
    {
      path: '/leaderboard/:category',
      name: 'leaderboard',
      component: () => import('@/views/LeaderboardView.vue'),
      props: (route) => ({
        category: route.params.category,
        sessionId: typeof route.query.session === 'string' ? route.query.session : undefined,
      }),
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
})
