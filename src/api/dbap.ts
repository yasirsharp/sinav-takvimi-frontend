import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'

/** Ders–Bölüm–Akademik Personel eşleştirmesi: hangi dersi hangi bölümde kim veriyor */
export interface DbapDetail {
  id: number
  dersId: number
  dersAd: string
  dersKodu: string | null
  bolumId: number
  bolumAd: string
  akademikPersonelId: number
  akademikPersonelAd: string
  unvan: string
}

export interface DbapFormValues {
  bolumId: number
  dersId: number
  akademikPersonelId: number
}

export const dbapApi = {
  list: () => unwrapData(apiClient.get<ApiResult<DbapDetail[]>>('/api/dbap/details')),
  create: (values: DbapFormValues) => unwrap(apiClient.post<ApiResult<null>>('/api/dbap', values)),
  update: (id: number, values: DbapFormValues) =>
    unwrap(apiClient.put<ApiResult<null>>('/api/dbap', { id, ...values, status: true })),
  /** Bağlı sınav varsa backend "silinemez" mesajı döner */
  remove: (id: number) => unwrap(apiClient.delete<ApiResult<null>>(`/api/dbap/${id}`)),
}
