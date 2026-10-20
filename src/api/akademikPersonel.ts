import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'
import type { BulkResult, CreatedAccount } from './account'

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
  /** Sadece eklemede: verilirse kullanıcı adı e-postadan üretilir */
  email?: string | null
}

export const akademikPersonelApi = {
  list: () => unwrapData(apiClient.get<ApiResult<AkademikPersonel[]>>('/api/AkademikPersonel')),
  /** Giriş yapan kullanıcının akademik personel kaydı (yoksa hata) */
  getByUserId: (userId: number) =>
    unwrapData(apiClient.get<ApiResult<AkademikPersonel>>(`/api/AkademikPersonel/by-user-id/${userId}`)),
  /** Yanıtın data alanında (eski backend'de mesajında) kullanıcı adı ve geçici parola bulunur */
  create: (values: AkademikPersonelFormValues) =>
    unwrap(apiClient.post<ApiResult<CreatedAccount | null>>('/api/AkademikPersonel', values)),
  bulkCreate: (rows: AkademikPersonelFormValues[]) =>
    unwrapData(apiClient.post<ApiResult<BulkResult>>('/api/AkademikPersonel/bulk', rows, { timeout: 300_000 })),
  update: (personel: AkademikPersonel, values: AkademikPersonelFormValues) =>
    unwrap(
      apiClient.put<ApiResult<null>>('/api/AkademikPersonel', { ...personel, ad: values.ad, unvan: values.unvan }),
    ),
  remove: (id: number) => unwrap(apiClient.delete<ApiResult<null>>(`/api/AkademikPersonel/${id}`)),
}
