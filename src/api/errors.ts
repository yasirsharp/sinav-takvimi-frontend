import { isAxiosError } from 'axios'
import type { ApiResult, ValidationErrorResponse } from './types'

/**
 * Backend hatasını kullanıcıya gösterilecek Türkçe mesaja çevirir.
 * Backend iki farklı biçim döndürür:
 *  - İş kuralı hataları: { success: false, message }                  (400)
 *  - Doğrulama hataları: { success: false, message, errors: [{ errorMessage }] } (400)
 *    (eski backend: { Message, Errors: [{ ErrorMessage }] })
 */
export function getErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.'
  }

  if (!error.response) {
    return 'Sunucuya ulaşılamadı. İnternet bağlantınızı veya API adresini kontrol edin.'
  }

  const { status, data } = error.response

  if (status === 429) {
    return 'Çok fazla deneme yaptınız. Lütfen 1 dakika sonra tekrar deneyin.'
  }
  if (status === 401) {
    return 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.'
  }
  if (status === 403) {
    // Örn. "Devam etmeden önce parolanızı değiştirmeniz gerekiyor." veya super.admin koruması
    const forbidden = data as Partial<ApiResult> | undefined
    return forbidden?.message || 'Bu işlem için yetkiniz yok.'
  }
  if (status >= 500) {
    return 'Sunucuda beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
  }

  const validation = data as ValidationErrorResponse | undefined
  if (validation?.errors?.length) {
    return [...new Set(validation.errors.map((e) => e.errorMessage))].join(' ')
  }
  if (validation?.Errors?.length) {
    return validation.Errors.map((e) => e.ErrorMessage).join(' ')
  }

  const result = data as Partial<ApiResult> | undefined
  if (result?.message) {
    return result.message
  }

  return 'İşlem gerçekleştirilemedi.'
}
