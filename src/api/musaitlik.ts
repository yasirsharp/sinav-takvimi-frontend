import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'

/** Backend TekrarTipiEnum */
export const TekrarTipi = { Tekil: 0, Haftalik: 1, Aylik: 2 } as const
export type TekrarTipiValue = (typeof TekrarTipi)[keyof typeof TekrarTipi]

export interface Musaitlik {
  id: number
  akademikPersonelId: number
  /** "2026-11-02T00:00:00" */
  baslangicTarihi: string
  bitisTarihi?: string | null
  /** "09:00:00"; ikisi de boşsa tüm gün */
  baslangicSaati?: string | null
  bitisSaati?: string | null
  tekrarTipi: TekrarTipiValue
  /** Haftalık: 0=Pazar..6=Cumartesi, aylık: ayın günü (backend başlangıç tarihinden hesaplar) */
  tekrarGunu?: number | null
  isMusait: boolean
  neden?: string | null
  aciklama?: string | null
}

export type MusaitlikValues = Omit<Musaitlik, 'id' | 'tekrarGunu'>

export const musaitlikApi = {
  byPersonel: (personelId: number) =>
    unwrapData(apiClient.get<ApiResult<Musaitlik[]>>(`/api/AkademikPersonelMusaitlik/personel/${personelId}`)),
  create: (values: MusaitlikValues) => unwrap(apiClient.post<ApiResult<unknown>>('/api/AkademikPersonelMusaitlik', values)),
  update: (id: number, values: MusaitlikValues) =>
    unwrap(apiClient.put<ApiResult<unknown>>('/api/AkademikPersonelMusaitlik', { id, ...values })),
  remove: (id: number) => unwrap(apiClient.delete<ApiResult<null>>(`/api/AkademikPersonelMusaitlik/${id}`)),
  removeMany: (ids: number[]) => unwrap(apiClient.post<ApiResult<null>>('/api/AkademikPersonelMusaitlik/batch-delete', ids)),
  /** Verilen tarih ve saat aralığında kendini "meşgul" olarak işaretlemiş akademik personel ID'leri */
  mesgulPersonelIds: (tarih: string, baslangicSaati: string, bitisSaati: string) =>
    unwrapData(
      apiClient.get<ApiResult<number[]>>('/api/AkademikPersonelMusaitlik/mesgul-personeller', {
        params: { tarih, baslangicSaati, bitisSaati },
      }),
    ),
}
