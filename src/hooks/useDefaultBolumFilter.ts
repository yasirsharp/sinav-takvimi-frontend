import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { Roles, Yonetici, hasAnyRole } from '../auth/roles'

/**
 * Bölüm filtresi durumu. Yönetici olmayan bölüm görevlisi için varsayılan olarak
 * kendi bölümleriyle (token'daki BolumId claim'leri) başlar; diğer herkes için boştur (tüm bölümler).
 */
export function useDefaultBolumFilter() {
  const { user } = useAuth()
  return useState<number[]>(() => {
    if (!user) return []
    const isGorevli = user.roles.includes(Roles.BolumGorevlisi) && !hasAnyRole(user.roles, Yonetici)
    return isGorevli ? user.bolumIds : []
  })
}
