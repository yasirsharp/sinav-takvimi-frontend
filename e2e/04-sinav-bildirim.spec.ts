import { expect, test } from '@playwright/test'
import { adminToken, api, dayFromToday, login, loginAsAdmin, provisionUser } from './helpers'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  const token = await adminToken()
  const dbap = await api<{ id: number; akademikPersonelId: number; dersAd: string }[]>('GET', '/api/DBAP', undefined, token)
  const derslikler = await api<{ id: number; ad: string }[]>('GET', '/api/Derslik', undefined, token)
  const personeller = await api<{ id: number; ad: string }[]>('GET', '/api/AkademikPersonel', undefined, token)
  const zeynep = personeller.body.data.find((p) => p.ad === 'Zeynep Çelik')!
  const ali = personeller.body.data.find((p) => p.ad === 'Ali Can Yıldız')!
  const veriYapilari = dbap.body.data.find((d) => d.akademikPersonelId === zeynep.id)!
  const derslik = derslikler.body.data.find((d) => d.ad === 'MF-A101')!

  const created = await api('POST', '/api/SinavDetay', {
    dersBolumAkademikPersonelId: veriYapilari.id,
    sinavTarihi: `${dayFromToday(1)}T00:00:00`,
    sinavBaslangicSaati: '10:00',
    sinavBitisSaati: '12:00',
    derslikler: [{ derslikId: derslik.id, gozetmenId: ali.id }],
  }, token)
  expect(created.status).toBe(200)

  // Aynı saatte aynı derslik: çakışma
  const conflict = await api('POST', '/api/SinavDetay', {
    dersBolumAkademikPersonelId: veriYapilari.id,
    sinavTarihi: `${dayFromToday(1)}T00:00:00`,
    sinavBaslangicSaati: '11:00',
    sinavBitisSaati: '12:30',
    derslikler: [{ derslikId: derslik.id, gozetmenId: null }],
  }, token)
  expect(conflict.status).toBe(400)

  await api('POST', '/api/Announcement/create', {
    title: 'Sınav dönemi başlıyor',
    content: 'Final sınavları yarın başlıyor.',
    type: 'urgent',
    priority: 2,
    targetAudience: 'ogrenci',
    targetBolumId: null,
    publishDate: `${dayFromToday(-1)}T00:00:00`,
    expiryDate: null,
    showAsPopup: true,
    isActive: true,
  }, token)

  await provisionUser('alican.yildiz', 'AliCan2026x')
  await provisionUser('2026100001', 'Ogrenci2026x')
})

test('gözetmen ana sayfada görevini ve zilde bildirimini görür', async ({ page }) => {
  await login(page, 'alican.yildiz', 'AliCan2026x')
  await page.waitForURL('/')
  await expect(page.getByText('Sınav görevlerim (14 gün)')).toBeVisible()
  await expect(page.getByText('Veri Yapıları').first()).toBeVisible()
  await expect(page.getByText(/Gözetmen · MF-A101/)).toBeVisible()
  await expect(page.getByText('Yarın', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /Bildirimler, 1 okunmamış/ }).click()
  await expect(page.getByText(/Gözetmen olarak görevlendirildiniz/)).toBeVisible()
  await page.getByText('Gözetmen görevi').click()
  await page.waitForURL('**/sinav-takvimi')
  await expect(page.getByRole('button', { name: 'Bildirimler', exact: true })).toBeVisible()
})

test('öğrenci açılır duyuruyu bir kez görür ve yaklaşan sınavını telefonda görür', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page, '2026100001', 'Ogrenci2026x')
  await page.waitForURL('/')
  await expect(page.getByRole('dialog')).toContainText('Sınav dönemi başlıyor')
  await page.getByRole('button', { name: 'Okudum' }).click()
  await expect(page.getByText('Yaklaşan sınavlarım')).toBeVisible()
  await expect(page.getByText('Veri Yapıları')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Yaklaşan sınavlarım')).toBeVisible()
  await page.waitForTimeout(1000)
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // Mobil menü: öğrenci yönetim menülerini görmez
  await page.getByRole('button', { name: 'Menüyü aç' }).click()
  await expect(page.getByText('Sınav Takvimi', { exact: true }).last()).toBeVisible()
  await expect(page.getByText('Tanımlar')).toHaveCount(0)
})

test('yönetici ana sayfası yaklaşan sınavları ve uyarıları gösterir', async ({ page }) => {
  await loginAsAdmin(page)
  await expect(page.getByText('Yaklaşan sınavlar (14 gün)')).toBeVisible()
  await expect(page.getByText('Veri Yapıları').first()).toBeVisible()
  await expect(page.getByText(/dersin öğretim elemanı atanmamış/)).toBeVisible()
})
