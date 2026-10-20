import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { announcementState } from './duyuruUtils'

describe('duyuru durumu', () => {
  const now = dayjs('2026-10-20T12:00:00')
  it('pasif, planlandı, yayında ve süresi doldu ayrımı', () => {
    expect(announcementState({ isActive: false, publishDate: '2026-10-01T00:00:00' }, now).label).toBe('Pasif')
    expect(announcementState({ isActive: true, publishDate: '2026-10-21T09:00:00' }, now).label).toBe('Planlandı')
    expect(announcementState({ isActive: true, publishDate: '2026-10-01T00:00:00', expiryDate: null }, now).label).toBe('Yayında')
    expect(
      announcementState({ isActive: true, publishDate: '2026-10-01T00:00:00', expiryDate: '2026-10-20T11:00:00' }, now).label,
    ).toBe('Süresi doldu')
  })
})
