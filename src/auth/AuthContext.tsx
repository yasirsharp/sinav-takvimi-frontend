import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setUnauthorizedHandler } from '../api/client'
import { changePassword as changePasswordRequest, login as loginRequest } from '../api/auth'
import { AuthContext, type SessionEndReason } from './authContext'
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
  const [sessionEndReason, setSessionEndReason] = useState<SessionEndReason | null>(null)

  const endSession = useCallback((reason: SessionEndReason) => {
    tokenStorage.clear()
    setSessionEndReason(reason)
    setUser(null)
  }, [])

  const logout = useCallback(() => endSession('logout'), [endSession])
  const expire = useCallback(() => endSession('expired'), [endSession])

  const applyToken = useCallback((token: string) => {
    const parsed = parseToken(token)
    if (!parsed) {
      throw new Error('Sunucudan geçersiz oturum bilgisi alındı.')
    }
    tokenStorage.set(token)
    setSessionEndReason(null)
    setUser(parsed)
  }, [])

  const login = useCallback(
    async (identifier: string, password: string) => {
      const { token } = await loginRequest(identifier, password)
      applyToken(token)
    },
    [applyToken],
  )

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const { token } = await changePasswordRequest(currentPassword, newPassword)
      applyToken(token)
    },
    [applyToken],
  )

  // Herhangi bir API isteği 401 dönerse oturumu kapat
  useEffect(() => {
    setUnauthorizedHandler(expire)
    return () => setUnauthorizedHandler(null)
  }, [expire])

  // Token süresi dolduğunda otomatik çıkış
  useEffect(() => {
    if (!user) return
    // setTimeout en fazla ~24,8 gün bekleyebilir
    const delay = Math.min(Math.max(user.expiresAt - Date.now(), 0), 2_147_483_647)
    const timer = window.setTimeout(expire, delay)
    return () => window.clearTimeout(timer)
  }, [user, expire])

  const value = useMemo(
    () => ({ user, sessionEndReason, login, logout, changePassword }),
    [user, sessionEndReason, login, logout, changePassword],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
