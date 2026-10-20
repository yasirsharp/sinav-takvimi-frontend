import { expect, test } from '@playwright/test'
import { api, apiLogin, dayFromToday } from './helpers'

/** Öğrenci yetkileri (API düzeyinde). 04 numaralı testte öğrencinin parolası belirlenmiş olmalı. */
test('öğrenci sadece kendi bölümünün sınav takvimine ve resmi raporuna erişir', async () => {
  const token = await apiLogin('2026100001', 'Ogrenci2026x')
  const range = `startDate=${dayFromToday(0)}&endDate=${dayFromToday(30)}`

  expect((await api('GET', `/api/SinavDetay/daterange?${range}`, undefined, token)).status).toBe(403)
  const own = await api<unknown[]>('GET', `/api/SinavDetay/daterange-bolum?${range}`, undefined, token)
  expect(own.status).toBe(200)
  expect(own.body.data.length).toBeGreaterThan(0)
  expect((await api('GET', `/api/SinavDetay/daterange-bolum?${range}&bolumId=999`, undefined, token)).status).toBe(403)

  expect((await api('GET', '/api/AkademikPersonel', undefined, token)).status).toBe(403)
  expect((await api('GET', '/api/Announcement/manage', undefined, token)).status).toBe(403)
  expect((await api('GET', `/api/Report/gozetmen-assignment-report?${range}`, undefined, token)).status).toBe(403)

  const report = await fetch(`${process.env.E2E_API_URL ?? 'http://localhost:8081'}/api/Report/official-sinav-report?${range}&bolumIds=999`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(report.status).toBe(200)
  expect(report.headers.get('content-type')).toContain('application/pdf')
})

test('bilinmeyen API adresi 404, sağlık kontrolü çalışır', async () => {
  const base = process.env.E2E_API_URL ?? 'http://localhost:8081'
  expect((await fetch(`${base}/api/yok-boyle-bir-adres`)).status).toBe(404)
  const health = await fetch(`${base}/health`)
  expect(health.status).toBe(200)
  expect(await health.json()).toEqual({ status: 'Healthy' })
})
