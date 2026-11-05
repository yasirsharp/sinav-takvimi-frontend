import { useMemo } from 'react'
import { useAuth } from '../auth/useAuth'
import { Roles, Yonetici, hasAnyRole } from '../auth/roles'

/**
 * Bölüm görevlisinin kapsamı (sunucudaki BolumScope ile aynı kurallar; asıl kontrol sunucudadır).
 * Yönetici sınırsızdır. Görevli yalnızca kendi bölümlerinin kayıtlarını değiştirir; ortak (bölümsüz) veya başka
 * bölümü de içeren kayıtları yalnızca yönetici değiştirir.
 */
export function useBolumScope() {
  const { user } = useAuth()
  return useMemo(() => {
    const roles = user?.roles ?? []
    const isScoped = !hasAnyRole(roles, Yonetici) && roles.includes(Roles.BolumGorevlisi)
    const own = user?.bolumIds ?? []
    return {
      isScoped,
      /** BolumSelect onlyIds için: görevlide kendi bölümleri, diğerlerinde undefined (tümü) */
      ownBolumIds: isScoped ? own : undefined,
      canAccess: (bolumId: number) => !isScoped || own.includes(bolumId),
      canManage: (bolumIds: readonly number[]) => !isScoped || (bolumIds.length > 0 && bolumIds.every((id) => own.includes(id))),
    }
  }, [user])
}

/** Görevliye neden düzenleyemediğini anlatan kısa metin */
export const SCOPE_LOCK_HINT = 'Ortak veya başka bölüme ait kayıtları yalnızca yönetici değiştirebilir.'
