import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setUnauthorizedHandler } from '../api/client'
import { login as loginRequest } from '../api/auth'
import { AuthContext } from './authContext'
import { isExpired, parseToken, type CurrentUser } from './jwt'
import { tokenStorage } from './tokenStorage'

function readStoredUser(): CurrentUser | null {
  const token = tokenStorage.get()
  if (!token) return null
  const user = parseToken(token)
  if (!user || isExpired(user)) {
    tokenStorage.clear()
    return null
  }
  return user
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(readStoredUser)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const login = useCallback(async (identifier: string, password: string) => {
    const { token } = await loginRequest(identifier, password)
    const parsed = parseToken(token)
    if (!parsed) {
      throw new Error('Sunucudan geçersiz oturum bilgisi alındı.')
    }
    tokenStorage.set(token)
    setUser(parsed)
  }, [])

  // Herhangi bir API isteği 401 dönerse oturumu kapat
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // Token süresi dolduğunda otomatik çıkış
  useEffect(() => {
    if (!user) return
    // setTimeout en fazla ~24,8 gün bekleyebilir
    const delay = Math.min(Math.max(user.expiresAt - Date.now(), 0), 2_147_483_647)
    const timer = window.setTimeout(logout, delay)
    return () => window.clearTimeout(timer)
  }, [user, logout])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
