import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'

export type TalepDurum = 'bekliyor' | 'kabul' | 'red'

/** Sınav değişiklik talebi (GET api/SinavTalep) */
export interface SinavTalep {
  id: number
  sinavDetayId: number
  /** Sınav hâlâ takvimde mi (silinmiş olabilir) */
  sinavVar: boolean
  /** Sınavın şimdiki tarihi */
  sinavTarihi?: string | null
  bolumId: number
  bolumAd: string
  sinavOzeti: string
  talepEdenAd: string
  /** ogretim-elemani | gozetmen */
  gorev: string
  neden: string
  onerilenTarih?: string | null
  onerilenBaslangic?: string | null
  onerilenBitis?: string | null
  durum: TalepDurum
  yanitNotu?: string | null
  yanitlayanAd?: string | null
  yanitTarihi?: string | null
  createdDate: string
  /** Talebi ben mi açtım */
  benim: boolean
  /** Ben yanıtlayabilir miyim (yönetici veya o bölümün görevlisi) */
  yanitlayabilir: boolean
}

export interface SinavTalepCreate {
  sinavDetayId: number
  neden: string
  /** YYYY-MM-DD */
  onerilenTarih?: string | null
  /** HH:mm */
  onerilenBaslangic?: string | null
  onerilenBitis?: string | null
}

export const talepApi = {
  list: (durum?: TalepDurum) =>
    unwrapData(apiClient.get<ApiResult<SinavTalep[]>>('/api/SinavTalep', { params: durum ? { durum } : undefined })),
  pendingCount: () => unwrapData(apiClient.get<ApiResult<number>>('/api/SinavTalep/bekleyen-sayisi')),
  create: (values: SinavTalepCreate) => unwrap(apiClient.post<ApiResult<number>>('/api/SinavTalep', values)),
  answer: (id: number, durum: 'kabul' | 'red', not?: string) =>
    unwrap(apiClient.put<ApiResult<null>>(`/api/SinavTalep/${id}/yanit`, { durum, not })),
}
