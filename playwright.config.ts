import { defineConfig, devices } from '@playwright/test'

// Uçtan uca testler yalnızca CI'da çalışır (tarayıcılar yerelde indirilmez).
// API, testin içinde sahte sunucuyla (page.route) taklit edilir; backend gerekmez.
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-360', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 740 } } },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    // Aynı origin üzerinden /api/v1 → CORS ön kontrolü gerekmez.
    env: { VITE_API_BASE_URL: '/api/v1' },
  },
})
