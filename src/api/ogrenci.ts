import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'
import type { BulkResult, CreatedAccount } from './account'

export interface Ogrenci {
  id: number
  userId: number
  ogrenciNo: string
  ad: string
  soyad: string
  bolumId: number
  sinif?: number | null
  status: boolean
}

export interface OgrenciCreateValues {
  ogrenciNo: string
  ad: string
  soyad: string
  /** Boşsa backend <no>@ogr.duzce.edu.tr atar */
  email?: string | null
  bolumId: number
  sinif?: number | null
}

export interface OgrenciUpdateValues {
  ogrenciNo: string
  ad: string
  soyad: string
  bolumId: number
  sinif?: number | null
  status: boolean
}

export const ogrenciApi = {
  list: () => unwrapData(apiClient.get<ApiResult<Ogrenci[]>>('/api/Ogrenci')),
  /** Kullanıcı hesabı da açılır; yanıt kullanıcı adı ve geçici parolayı içerir */
  create: (values: OgrenciCreateValues) =>
    unwrapData(apiClient.post<ApiResult<CreatedAccount>>('/api/Ogrenci', values)),
  bulkCreate: (rows: OgrenciCreateValues[]) =>
    unwrapData(apiClient.post<ApiResult<BulkResult>>('/api/Ogrenci/bulk', rows, { timeout: 300_000 })),
  update: (id: number, values: OgrenciUpdateValues) =>
    unwrap(apiClient.put<ApiResult<null>>('/api/Ogrenci', { id, ...values })),
  remove: (id: number) => unwrap(apiClient.delete<ApiResult<null>>(`/api/Ogrenci/${id}`)),
}
