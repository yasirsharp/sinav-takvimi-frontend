import type { ApiResult } from './types'

/** İş kuralı hatası: backend 200 dönse bile success=false olabilir */
export class ApiResultError extends Error {}

/**
 * Backend'in { success, message, data } yanıtını açar.
 * success=false ise backend mesajıyla hata fırlatır (getErrorMessage bu mesajı gösterir).
 */
export async function unwrap<T>(request: Promise<{ data: ApiResult<T> }>): Promise<ApiResult<T>> {
  const { data } = await request
  if (!data.success) {
    throw new ApiResultError(data.message || 'İşlem gerçekleştirilemedi.')
  }
  return data
}

export async function unwrapData<T>(request: Promise<{ data: ApiResult<T> }>): Promise<T> {
  return (await unwrap(request)).data
}
