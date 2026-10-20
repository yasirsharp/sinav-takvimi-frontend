import dayjs from 'dayjs'
import type { Announcement } from '../../api/announcement'

/** Yayında mı, planlanmış mı, süresi mi doldu? */
export function announcementState(a: Pick<Announcement, 'isActive' | 'publishDate' | 'expiryDate'>, now = dayjs()) {
  if (!a.isActive) return { label: 'Pasif', color: 'default' }
  if (dayjs(a.publishDate).isAfter(now)) return { label: 'Planlandı', color: 'blue' }
  if (a.expiryDate && !dayjs(a.expiryDate).isAfter(now)) return { label: 'Süresi doldu', color: 'default' }
  return { label: 'Yayında', color: 'green' }
}
