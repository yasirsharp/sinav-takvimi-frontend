import { useMemo } from 'react'
import { useAuth } from '../auth/useAuth'
import { Roles, Yonetici, hasAnyRole } from '../auth/roles'

/**
 * Bölüm kapsamı (sunucudaki BolumScope ile aynı kurallar; asıl kontrol sunucudadır).
 * - Yönetici sınırsızdır.
 * - Bölüm görevlisi kendi bölümlerini görür ve yönetir; ortak (bölümsüz) veya başka bölümü de içeren kayıtları yalnızca
 *   yönetici değiştirir.
 * - Görevli personel atandığı bölüm(ler)i yalnızca görür.
 */
export function useBolumScope() {
  const { user } = useAuth()
  return useMemo(() => {
    const roles = user?.roles ?? []
    const gorevli = roles.includes(Roles.BolumGorevlisi)
    const gp = roles.includes(Roles.GorevliPersonel)
    const isScoped = !hasAnyRole(roles, Yonetici) && (gorevli || gp)
    const manage = gorevli ? (user?.bolumIds ?? []) : []
    const read = [...new Set([...manage, ...(user?.okumaBolumIds ?? [])])]
    return {
      isScoped,
      /** BolumSelect onlyIds için: kapsamlı kullanıcıda görebildiği bölümler, diğerlerinde undefined (tümü) */
      ownBolumIds: isScoped ? read : undefined,
      /** Görevli personelin bölümü atanmamışsa hiçbir bölüm verisi göremez */
      noBolum: isScoped && read.length === 0,
      canAccess: (bolumId: number) => !isScoped || read.includes(bolumId),
      canManage: (bolumIds: readonly number[]) =>
        !isScoped || (bolumIds.length > 0 && bolumIds.every((id) => manage.includes(id))),
    }
  }, [user])
}

/** Görevliye neden düzenleyemediğini anlatan kısa metin */
export const SCOPE_LOCK_HINT = 'Ortak veya başka bölüme ait kayıtları yalnızca yönetici değiştirebilir.'
