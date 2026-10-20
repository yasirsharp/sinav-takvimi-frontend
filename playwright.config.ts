import { defineConfig, devices } from '@playwright/test'

/**
 * Uçtan uca testler GERÇEK backend'e karşı çalışır ve BOŞ bir test veritabanı bekler (bkz. e2e/README.md).
 * Testler sırayla çalışır: kurulum testi sonraki testlerin kullandığı verileri oluşturur.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
    viewport: { width: 1366, height: 900 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : undefined,
  },
  // E2E_BASE_URL verilmezse Vite geliştirme sunucusu başlatılır (/api → VITE_DEV_API_PROXY_TARGET)
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --port 5173 --strictPort',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        env: { VITE_FEEDBACK_EMAIL: 'sinav-test@duzce.edu.tr' },
      },
})
