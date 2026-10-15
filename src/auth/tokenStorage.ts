const TOKEN_KEY = 'sinav-takvimi.token'

/**
 * JWT localStorage'da tutulur (backend Authorization: Bearer başlığı bekliyor).
 * Not: XSS'e karşı daha güvenli yöntem, backend'e refresh token + httpOnly cookie desteği eklemektir.
 */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Gizli sekme vb. durumlarda depolama kapalı olabilir; oturum sadece bellekte yaşar.
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // yoksay
    }
  },
}
