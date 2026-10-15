import axios from 'axios'
import { tokenStorage } from '../auth/tokenStorage'

/**
 * Tüm API istekleri bu instance üzerinden yapılır.
 * - Geliştirmede baseURL boştur; Vite proxy /api isteklerini backend'e yönlendirir.
 * - Production'da VITE_API_BASE_URL ile backend adresi verilir.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

/** AuthProvider, 401 yanıtında oturumu kapatmak için kendini buraya kaydeder. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Login isteğindeki 401/400 oturum düşmesi sayılmaz
    const isLoginRequest = error.config?.url?.includes('/api/Auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)
