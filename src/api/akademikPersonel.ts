import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'

export interface AkademikPersonel {
  id: number
  ad: string
  unvan: string
  userId: number
  status?: boolean
}

export interface AkademikPersonelFormValues {
  ad: string
  unvan: string
}

export const akademikPersonelApi = {
  list: () => unwrapData(apiClient.get<ApiResult<AkademikPersonel[]>>('/api/AkademikPersonel')),
  /** Giriş yapan kullanıcının akademik personel kaydı (yoksa hata) */
  getByUserId: (userId: number) =>
    unwrapData(apiClient.get<ApiResult<AkademikPersonel>>(`/api/AkademikPersonel/by-user-id/${userId}`)),
  /** Yanıt mesajında yeni kullanıcının kullanıcı adı ve geçici parolası bulunur */
  create: (values: AkademikPersonelFormValues) =>
    unwrap(apiClient.post<ApiResult<null>>('/api/AkademikPersonel', values)),
  update: (personel: AkademikPersonel, values: AkademikPersonelFormValues) =>
    unwrap(apiClient.put<ApiResult<null>>('/api/AkademikPersonel', { ...personel, ...values })),
  remove: (id: number) => unwrap(apiClient.delete<ApiResult<null>>(`/api/AkademikPersonel/${id}`)),
}
