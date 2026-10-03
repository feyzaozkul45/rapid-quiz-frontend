import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.ts'],
    globals: false,
    // .env'deki yerel değer (0 = koruma kapalı) testleri etkilemesin.
    env: { VITE_COLD_START_TIMEOUT_MS: '90000' },
  },
})
