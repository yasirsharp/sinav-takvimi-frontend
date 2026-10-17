import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'
import type { BolumInfo } from './ders'

export interface DerslikWithBolumler {
  derslikId: number
  derslikAd: string
  kapasite: number
  ortakDerslik: boolean
  status: boolean
  bolumler: BolumInfo[]
}

export interface DerslikFormValues {
  ad: string
  kapasite: number
  ortakDerslik: boolean
  status: boolean
  bolumIds: number[]
}

export const derslikApi = {
  list: () => unwrapData(apiClient.get<ApiResult<DerslikWithBolumler[]>>('/api/Derslik/with-bolumler')),
  create: (values: DerslikFormValues) =>
    unwrap(apiClient.post<ApiResult<null>>('/api/Derslik/with-bolumler', values)),
  update: (id: number, values: DerslikFormValues) =>
    unwrap(apiClient.put<ApiResult<null>>('/api/Derslik/with-bolumler', { id, ...values })),
  remove: (id: number) => unwrap(apiClient.delete<ApiResult<null>>(`/api/Derslik/${id}`)),
}
