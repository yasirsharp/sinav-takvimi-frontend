import { apiClient } from './client'
import type { AccessToken, ApiResult, LoginRequest } from './types'

/**
 * Giriş: tek alana yazılan değer "@" içeriyorsa e-posta, içermiyorsa kullanıcı adı olarak gönderilir.
 */
export function buildLoginRequest(identifier: string, password: string): LoginRequest {
  const value = identifier.trim()
  return value.includes('@') ? { email: value, password } : { userName: value, password }
}

export async function login(identifier: string, password: string): Promise<AccessToken> {
  const { data } = await apiClient.post<ApiResult<AccessToken>>(
    '/api/Auth/login',
    buildLoginRequest(identifier, password),
  )

  if (!data.success || !data.data?.token) {
    throw new Error(data.message || 'Giriş yapılamadı.')
  }
  return data.data
}
