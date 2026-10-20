/** Derleme sırasında vite.config.ts'te tanımlanır */
export const appVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'
export const appCommit = typeof __APP_COMMIT__ === 'string' ? __APP_COMMIT__ : ''
export const appBuildDate = typeof __APP_BUILD_DATE__ === 'string' ? __APP_BUILD_DATE__ : ''

export const appVersionLabel = `v${appVersion}${appCommit ? ` (${appCommit})` : ''}`

export const feedbackEmail = (import.meta.env.VITE_FEEDBACK_EMAIL ?? '').trim()

interface FeedbackContext {
  url: string
  userAgent: string
  roles: string[]
  userName?: string
  now?: Date
}

/** "Sorun bildir" için konu ve gövdesi doldurulmuş mailto bağlantısı */
export function buildFeedbackMailto(to: string, ctx: FeedbackContext): string {
  const subject = `[Sınav Takvimi] Sorun bildirimi`
  const body = [
    'Ne yapmaya çalışıyordunuz?',
    '',
    '',
    'Ne oldu? (Hata mesajı varsa yazın veya ekran görüntüsü ekleyin)',
    '',
    '',
    '---- Teknik bilgiler (silmeyin) ----',
    `Sayfa: ${ctx.url}`,
    `Sürüm: ${appVersionLabel} ${appBuildDate}`,
    `Kullanıcı: ${ctx.userName ?? '-'}`,
    `Roller: ${ctx.roles.join(', ') || '-'}`,
    `Zaman: ${(ctx.now ?? new Date()).toLocaleString('tr-TR')}`,
    `Tarayıcı: ${ctx.userAgent}`,
  ].join('\n')
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
