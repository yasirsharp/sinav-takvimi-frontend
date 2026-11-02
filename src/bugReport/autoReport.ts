import { isAxiosError } from 'axios'
import { bugReportApi } from '../api/bugReport'
import { tokenStorage } from '../auth/tokenStorage'
import { appBuildDate, appVersionLabel } from '../utils/appInfo'

/**
 * Sayfada beklenmeyen hata olduğunda (çökme, yakalanmamış hata) kullanıcı bildirmeden kayıt açar.
 * Ekran görüntüsü alınmaz. Aynı hata bir oturumda bir kez, en fazla 10 kayıt gönderilir; sunucu da aynı hatayı
 * tek kayıtta toplar (sayaç). API hataları burada gönderilmez: sunucu hataları sunucuda kaydedilir, 4xx'ler
 * iş kuralıdır (kullanıcı "Bu bir hata mı? Bildir" ile bildirebilir).
 */
const MAX_PER_SESSION = 10
const sent = new Set<string>()

/** Uygulamayla ilgisi olmayan bilinen gürültü */
const NOISE = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /chrome-extension:|moz-extension:|safari-extension:/i,
  // Yeni sürüm yüklendikten sonra eski sekmenin parça indirememesi: hata değil, sayfa yenileme önerilir
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i,
]

export function isNoise(message: string, stack?: string): boolean {
  return NOISE.some((re) => re.test(message) || (stack ? re.test(stack) : false))
}

export function describeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: `${error.name}: ${error.message}`, stack: error.stack }
  if (typeof error === 'string') return { message: error }
  try {
    return { message: JSON.stringify(error) }
  } catch {
    return { message: String(error) }
  }
}

/** Gönderilecekse true; aynı iz oturumda bir kez, toplam en fazla 10 */
export function shouldSend(key: string): boolean {
  if (sent.has(key) || sent.size >= MAX_PER_SESSION) return false
  sent.add(key)
  return true
}

export function resetAutoReportState() {
  sent.clear()
}

export function reportClientError(kind: 'crash' | 'error' | 'promise', error: unknown, extraStack?: string) {
  // API hataları burada değil: sunucu kendisi kaydeder veya iş kuralı mesajıdır
  if (isAxiosError(error)) return
  if (!tokenStorage.get()) return
  const { message, stack } = describeError(error)
  const fullStack = [stack, extraStack].filter(Boolean).join('\n--- bileşen yığını ---\n')
  if (!message || isNoise(message, fullStack)) return
  // Tür anahtara girmez: geliştirmede React aynı çökmeyi pencere hatası olarak da bildirir
  if (!shouldSend(`${message}|${window.location.pathname}`)) return

  void bugReportApi
    .auto({
      kind,
      message: message.slice(0, 1000),
      stack: fullStack.slice(0, 8000),
      pageUrl: window.location.origin + window.location.pathname,
      appVersion: `${appVersionLabel} ${appBuildDate}`.trim(),
      viewport: `${window.innerWidth}×${window.innerHeight}`,
    })
    .catch(() => undefined) // kayıt gönderilemese de kullanıcı etkilenmez
}

let installed = false

/** Yakalanmamış hatalar ve reddedilen promise'ler (uygulama açılırken bir kez) */
export function installAutoReport() {
  if (installed) return
  installed = true
  window.addEventListener('error', (e) => reportClientError('error', e.error ?? e.message))
  window.addEventListener('unhandledrejection', (e) => reportClientError('promise', e.reason))
}
