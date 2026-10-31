import type { AxiosError } from 'axios'
import { apiClient } from '../api/client'

/**
 * Hata bildirimine eklenecek istemci günlüğü: son konsol hataları, yakalanmamış hatalar ve başarısız API
 * istekleri. İstek/yanıt gövdesi ve token tutulmaz.
 */
export interface ClientLogEntry {
  time: string
  kind: 'console' | 'error' | 'promise' | 'api'
  message: string
}

const MAX_ENTRIES = 30
const MAX_MESSAGE = 500
const entries: ClientLogEntry[] = []
let installed = false

export function addLogEntry(kind: ClientLogEntry['kind'], message: string) {
  entries.push({
    time: new Date().toISOString(),
    kind,
    message: message.slice(0, MAX_MESSAGE),
  })
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES)
}

export function getLogEntries(): ClientLogEntry[] {
  return [...entries]
}

export function clearLogEntries() {
  entries.length = 0
}

function stringify(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}`
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/** Adresteki sorgu parametrelerini atar (arama terimleri vb. kişisel veri içerebilir) */
function stripQuery(url: string | undefined): string {
  return (url ?? '').split('?')[0]
}

export function describeApiError(error: AxiosError): string {
  const method = (error.config?.method ?? 'get').toUpperCase()
  const status = error.response?.status ?? (error.code === 'ECONNABORTED' ? 'zaman aşımı' : 'ağ hatası')
  const data = error.response?.data as { message?: string } | undefined
  const message = typeof data?.message === 'string' ? ` · ${data.message}` : ''
  return `${method} ${stripQuery(error.config?.url)} → ${status}${message}`
}

/** Uygulama açılırken bir kez çağrılır */
export function installClientLog() {
  if (installed) return
  installed = true

  const originalError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    addLogEntry('console', args.map(stringify).join(' '))
    originalError(...args)
  }
  window.addEventListener('error', (e) => addLogEntry('error', `${e.message} (${stripQuery(e.filename)}:${e.lineno})`))
  window.addEventListener('unhandledrejection', (e) => addLogEntry('promise', stringify(e.reason)))
  apiClient.interceptors.response.use(undefined, (error: AxiosError) => {
    addLogEntry('api', describeApiError(error))
    return Promise.reject(error)
  })
}
