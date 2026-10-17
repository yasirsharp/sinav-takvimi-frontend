import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'

export interface Bolum {
  id: number
  ad: string
  status?: boolean
}

export const bolumApi = {
  list: () => unwrapData(apiClient.get<ApiResult<Bolum[]>>('/api/Bolum')),
  create: (values: { ad: string }) => unwrap(apiClient.post<ApiResult<null>>('/api/Bolum', values)),
  update: (values: Bolum) => unwrap(apiClient.put<ApiResult<null>>('/api/Bolum', values)),
  remove: (id: number) => unwrap(apiClient.delete<ApiResult<null>>(`/api/Bolum/${id}`)),
}
