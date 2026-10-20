import { apiClient } from './client'
import { unwrapData } from './result'
import type { ApiResult } from './types'

export const musaitlikApi = {
  /** Verilen tarih ve saat aralığında kendini "meşgul" olarak işaretlemiş akademik personel ID'leri */
  mesgulPersonelIds: (tarih: string, baslangicSaati: string, bitisSaati: string) =>
    unwrapData(
      apiClient.get<ApiResult<number[]>>('/api/AkademikPersonelMusaitlik/mesgul-personeller', {
        params: { tarih, baslangicSaati, bitisSaati },
      }),
    ),
}
