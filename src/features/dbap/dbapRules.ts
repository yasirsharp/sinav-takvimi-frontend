import type { DbapDetail, DbapFormValues } from '../../api/dbap'
import type { DersWithBolumler } from '../../api/ders'

/** Bölümde verilebilecek dersler: o bölüme bağlı dersler + ortak dersler */
export function derslerForBolum(dersler: DersWithBolumler[], bolumId: number | undefined): DersWithBolumler[] {
  if (!bolumId) return []
  return dersler.filter((d) => d.ortakDers || d.bolumler.some((b) => b.bolumId === bolumId))
}

/** Aynı ders + bölüm + personel eşleştirmesi zaten var mı? (düzenlenen kayıt hariç) */
export function isDuplicateDbap(list: DbapDetail[], values: DbapFormValues, excludeId?: number): boolean {
  return list.some(
    (x) =>
      x.id !== excludeId &&
      x.dersId === values.dersId &&
      x.bolumId === values.bolumId &&
      x.akademikPersonelId === values.akademikPersonelId,
  )
}

/**
 * Seçili bölümlerde verilen (ortak olmayan) ama hiç öğretim elemanı atanmamış dersler.
 * Sınav eklenebilmesi için her dersin en az bir eşleştirmesi olmalıdır.
 */
export function unassignedDersler(
  dersler: DersWithBolumler[],
  list: DbapDetail[],
  bolumIds: number[],
): { bolumId: number; bolumAd: string; ders: DersWithBolumler }[] {
  const result: { bolumId: number; bolumAd: string; ders: DersWithBolumler }[] = []
  for (const ders of dersler) {
    for (const bolum of ders.bolumler) {
      if (bolumIds.length && !bolumIds.includes(bolum.bolumId)) continue
      const assigned = list.some((x) => x.dersId === ders.dersId && x.bolumId === bolum.bolumId)
      if (!assigned) result.push({ bolumId: bolum.bolumId, bolumAd: bolum.bolumAd, ders })
    }
  }
  return result
}
