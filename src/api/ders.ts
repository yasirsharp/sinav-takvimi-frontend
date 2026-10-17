import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'

export interface BolumInfo {
  bolumId: number
  bolumAd: string
}

export interface DersWithBolumler {
  dersId: number
  dersAd: string
  kod: string | null
  ortakDers: boolean
  bolumler: BolumInfo[]
}

export interface DersFormValues {
  ad: string
  kod: string
  ortakDers: boolean
  bolumIds: number[]
}

export const dersApi = {
  list: () => unwrapData(apiClient.get<ApiResult<DersWithBolumler[]>>('/api/Ders/with-bolumler')),
  create: (values: DersFormValues) => unwrap(apiClient.post<ApiResult<null>>('/api/Ders/with-bolumler', values)),
  update: (id: number, values: DersFormValues) =>
    unwrap(apiClient.put<ApiResult<null>>('/api/Ders/with-bolumler', { id, ...values })),
  remove: (id: number) => unwrap(apiClient.delete<ApiResult<null>>(`/api/Ders/${id}`)),
  /** Ders kodu başka bir derste kullanılmıyorsa true */
  isKodUnique: (kod: string, excludeDersId?: number) =>
    unwrapData(
      apiClient.get<ApiResult<boolean>>('/api/Ders/check-kod-unique', { params: { kod, excludeDersId } }),
    ),
}
