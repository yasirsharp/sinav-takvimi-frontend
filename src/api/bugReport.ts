import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'

export type BugReportState = 'yeni' | 'inceleniyor' | 'cozuldu'

export const BUG_REPORT_STATES: Record<BugReportState, { label: string; color: string }> = {
  yeni: { label: 'Yeni', color: 'red' },
  inceleniyor: { label: 'İnceleniyor', color: 'gold' },
  cozuldu: { label: 'Çözüldü', color: 'green' },
}

export interface BugReportSummary {
  id: number
  userId: number
  userName: string
  roles: string
  description: string
  pageUrl: string
  appVersion: string
  userAgent: string
  viewport: string
  clientLog?: string | null
  hasScreenshot: boolean
  state: BugReportState
  adminNote?: string | null
  createdDate: string
  resolvedDate?: string | null
}

export interface NewBugReport {
  description: string
  pageUrl: string
  appVersion: string
  viewport: string
  clientLog: string
  screenshot?: Blob | null
}

export const bugReportApi = {
  create: (report: NewBugReport) => {
    const form = new FormData()
    form.append('description', report.description)
    form.append('pageUrl', report.pageUrl)
    form.append('appVersion', report.appVersion)
    form.append('viewport', report.viewport)
    form.append('clientLog', report.clientLog)
    if (report.screenshot) form.append('screenshot', report.screenshot, 'ekran.jpg')
    // Content-Type'ı tarayıcı (multipart sınırıyla) belirler
    return unwrapData(apiClient.post<ApiResult<number>>('/api/BugReport', form, { headers: { 'Content-Type': undefined } }))
  },
  list: (state?: BugReportState) => unwrapData(apiClient.get<ApiResult<BugReportSummary[]>>('/api/BugReport', { params: { state } })),
  newCount: () => unwrapData(apiClient.get<ApiResult<number>>('/api/BugReport/new-count')),
  screenshot: async (id: number) => (await apiClient.get<Blob>(`/api/BugReport/${id}/screenshot`, { responseType: 'blob' })).data,
  updateState: (id: number, state: BugReportState, adminNote?: string) =>
    unwrap(apiClient.put<ApiResult<null>>(`/api/BugReport/${id}/state`, { state, adminNote })),
  /** SMTP ayarını denemek için yöneticilere deneme e-postası (sonuç mesajı döner) */
  testEmail: async () => (await unwrap(apiClient.post<ApiResult<null>>('/api/BugReport/test-email'))).message,
  remove: (id: number) => unwrap(apiClient.delete<ApiResult<null>>(`/api/BugReport/${id}`)),
}
