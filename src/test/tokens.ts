/** Testler için imzasız (sadece payload'u anlamlı) JWT üretir */
export function makeToken(payload: Record<string, unknown>): string {
  // Türkçe karakterler için UTF-8 → base64url (backend de UTF-8 yazar)
  const encode = (obj: unknown) => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj))
    const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
    return btoa(binary).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  }
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`
}

export const CLAIMS = {
  id: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
}

export function futureExp(minutes = 60) {
  return Math.floor(Date.now() / 1000) + minutes * 60
}
