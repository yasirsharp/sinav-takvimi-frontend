import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'

export interface DerslikGozetmen {
  derslikId: number
  /** Backend gözetmensiz derslikte 0 döndürür; gönderirken null kullanılır */
  gozetmenId: number | null
}

/** GET /api/SinavDetay/daterange yanıtındaki her sınav (derslikler iç içe) */
export interface SinavDetay {
  id: number
  dersBolumAkademikPersonelId: number
  dersAd: string
  bolumId: number
  bolumAd: string
  akademikPersonelAd: string
  unvan: string
  /** "2026-01-12T00:00:00" */
  sinavTarihi: string
  /** "09:30:00" */
  sinavBaslangicSaati: string
  sinavBitisSaati: string
  derslikler: DerslikGozetmen[]
}

export interface SinavFormPayload {
  dersBolumAkademikPersonelId: number
  /** YYYY-MM-DD */
  sinavTarihi: string
  /** HH:mm:ss */
  sinavBaslangicSaati: string
  sinavBitisSaati: string
  derslikler: DerslikGozetmen[]
}

export const sinavApi = {
  /** Tarih aralığındaki sınavlar. endDate gün sonuna kadar dahildir. */
  listByDateRange: (startDate: string, endDate: string) =>
    unwrapData(
      apiClient.get<ApiResult<SinavDetay[]>>('/api/SinavDetay/daterange', {
        params: { startDate, endDate: `${endDate}T23:59:59` },
      }),
    ),
  create: (values: SinavFormPayload) => unwrap(apiClient.post<ApiResult<null>>('/api/SinavDetay', values)),
  update: (id: number, values: SinavFormPayload) =>
    unwrap(apiClient.put<ApiResult<null>>('/api/SinavDetay', { id, ...values })),
  remove: (id: number) => unwrap(apiClient.delete<ApiResult<null>>(`/api/SinavDetay/${id}`)),
}
