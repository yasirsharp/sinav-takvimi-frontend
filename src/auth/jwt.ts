import { jwtDecode } from 'jwt-decode'

// .NET JwtSecurityTokenHandler, ClaimTypes.* claim'lerini uzun URI adlarıyla yazar
const CLAIM_NAME_IDENTIFIER = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
const CLAIM_NAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

type JwtPayload = Record<string, unknown> & { exp?: number }

export interface CurrentUser {
  id: number
  name: string
  email: string
  roles: string[]
  /** Öğrenci için tek bölüm, bölüm görevlisi için birden çok bölüm ("1.BolumId", "2.BolumId"...) */
  bolumIds: number[]
  ogrenciNo?: string
  /** Geçici parolayla giriş yapıldı: parola değiştirilene kadar diğer sayfalar kapalıdır ("pwd_change" claim'i) */
  mustChangePassword: boolean
  /** Token bitiş zamanı (ms, epoch) */
  expiresAt: number
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string' && value.length > 0) return [value]
  return []
}

/** Token'ı çözer; geçersizse null döner. İmza doğrulaması backend'de yapılır. */
export function parseToken(token: string): CurrentUser | null {
  let payload: JwtPayload
  try {
    payload = jwtDecode<JwtPayload>(token)
  } catch {
    return null
  }

  const id = Number(payload[CLAIM_NAME_IDENTIFIER])
  if (!Number.isFinite(id) || typeof payload.exp !== 'number') return null

  const bolumIds = Object.entries(payload)
    .filter(([key]) => key === 'BolumId' || /^\d+\.BolumId$/.test(key))
    .map(([, value]) => Number(value))
    .filter(Number.isFinite)

  return {
    id,
    name: String(payload[CLAIM_NAME] ?? ''),
    email: String(payload.email ?? ''),
    roles: toStringArray(payload[CLAIM_ROLE]),
    bolumIds,
    ogrenciNo: typeof payload.OgrenciNo === 'string' ? payload.OgrenciNo : undefined,
    mustChangePassword: payload.pwd_change === 'true' || payload.pwd_change === true,
    expiresAt: payload.exp * 1000,
  }
}

export function isExpired(user: CurrentUser, now = Date.now()): boolean {
  return user.expiresAt <= now
}
