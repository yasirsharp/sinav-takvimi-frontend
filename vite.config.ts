/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/** Alt bilgide ve hata bildiriminde gösterilen sürüm: package.json sürümü + kısa commit */
function buildInfo() {
  const version = (JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string }).version
  let commit = ''
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    // git yoksa (ör. zip'ten derleme) commit gösterilmez
  }
  return { version, commit, date: new Date().toISOString().slice(0, 10) }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const info = buildInfo()

  return {
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(info.version),
      __APP_COMMIT__: JSON.stringify(info.commit),
      __APP_BUILD_DATE__: JSON.stringify(info.date),
    },
    server: {
      port: 5173,
      // Geliştirmede /api istekleri backend'e yönlendirilir; böylece CORS ayarı gerekmez.
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:8081',
          changeOrigin: true,
        },
      },
    },
    test: {
      // e2e/ altındaki Playwright testleri vitest ile çalışmaz
      include: ['src/**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})
