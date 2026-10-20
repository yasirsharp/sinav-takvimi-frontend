import { createContext } from 'react'
import type { CurrentUser } from './jwt'

/**
 * Oturum neden sona erdi?
 * - 'logout': kullanıcı "Çıkış yap" dedi. Bir sonraki girişte önceki sayfaya dönülmez
 *   (aynı bilgisayarda başka biri giriş yapabilir).
 * - 'expired': token süresi doldu veya API 401 döndü. Tekrar girişte kalınan sayfaya dönülür.
 */
export type SessionEndReason = 'logout' | 'expired'

export interface AuthContextValue {
  user: CurrentUser | null
  sessionEndReason: SessionEndReason | null
  login: (identifier: string, password: string) => Promise<void>
  /** Parolayı değiştirir ve backend'in döndüğü yeni token'la oturumu günceller */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
