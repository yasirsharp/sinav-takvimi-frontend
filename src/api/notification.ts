import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'

export interface AppNotification {
  id: number
  userId: number
  title: string
  message: string
  /** info, success, warning, error */
  type: string
  isRead: boolean
  actionUrl?: string | null
  relatedEntityType?: string | null
  relatedEntityId?: number | null
  createdDate: string
}

export const notificationApi = {
  list: (userId: number) => unwrapData(apiClient.get<ApiResult<AppNotification[]>>(`/api/Notification/user/${userId}`)),
  markRead: (id: number) => unwrap(apiClient.put<ApiResult<null>>(`/api/Notification/mark-read/${id}`)),
  markAllRead: (userId: number) => unwrap(apiClient.put<ApiResult<null>>(`/api/Notification/mark-all-read/${userId}`)),
}
