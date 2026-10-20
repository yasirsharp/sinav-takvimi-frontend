import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'

export type AnnouncementType = 'general' | 'urgent' | 'maintenance' | 'event'
export type AnnouncementAudience = 'all' | 'ogrenci' | 'personel' | 'yonetici'

export interface Announcement {
  id: number
  title: string
  content: string
  type: AnnouncementType
  /** 0 normal, 1 önemli, 2 acil */
  priority: number
  targetAudience: AnnouncementAudience
  targetBolumId?: number | null
  targetBolum?: { id: number; ad: string } | null
  publishDate: string
  expiryDate?: string | null
  isActive: boolean
  showAsPopup: boolean
  createdBy: number
  createdDate: string
}

export type AnnouncementValues = Pick<
  Announcement,
  'title' | 'content' | 'type' | 'priority' | 'targetAudience' | 'targetBolumId' | 'publishDate' | 'expiryDate' | 'isActive' | 'showAsPopup'
>

export const ANNOUNCEMENT_TYPES: Record<AnnouncementType, { label: string; color: string }> = {
  general: { label: 'Genel', color: 'blue' },
  urgent: { label: 'Acil', color: 'red' },
  maintenance: { label: 'Bakım', color: 'orange' },
  event: { label: 'Etkinlik', color: 'green' },
}

export const ANNOUNCEMENT_AUDIENCES: Record<AnnouncementAudience, string> = {
  all: 'Herkes',
  ogrenci: 'Öğrenciler',
  personel: 'Personel',
  yonetici: 'Yöneticiler',
}

export const PRIORITIES = ['Normal', 'Önemli', 'Acil']

export const announcementApi = {
  /** Yönetim listesi: yönetici için tümü, bölüm görevlisi için kendi bölümlerine yönelikler */
  manageList: () => unwrapData(apiClient.get<ApiResult<Announcement[]>>('/api/Announcement/manage')),
  mine: () => unwrapData(apiClient.get<ApiResult<Announcement[]>>('/api/Announcement/my-announcements')),
  myPopups: () => unwrapData(apiClient.get<ApiResult<Announcement[]>>('/api/Announcement/my-popup')),
  markRead: (id: number) => unwrap(apiClient.post<ApiResult<null>>(`/api/Announcement/${id}/read`)),
  create: (values: AnnouncementValues) => unwrap(apiClient.post<ApiResult<null>>('/api/Announcement/create', values)),
  update: (id: number, values: AnnouncementValues) =>
    unwrap(apiClient.put<ApiResult<null>>('/api/Announcement', { id, ...values })),
  remove: (id: number) => unwrap(apiClient.delete<ApiResult<null>>(`/api/Announcement/${id}`)),
}
