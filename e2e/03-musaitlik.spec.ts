import { expect, test } from '@playwright/test'
import { adminToken, api, dayFromToday, login, provisionUser } from './helpers'

const PASSWORD = 'Mehmet2026x'

/** Bugünden en az 7 gün sonraki ilk Salı */
function nextTuesday(): string {
  for (let i = 7; i < 14; i++) {
    if (new Date(`${dayFromToday(i)}T12:00:00Z`).getUTCDay() === 2) return dayFromToday(i)
  }
  throw new Error('unreachable')
}

test('akademik personel haftalık müsaitlik girer; backend o saati meşgul sayar', async ({ page }) => {
  await provisionUser('mehmet.oz', PASSWORD)
  await login(page, 'mehmet.oz', PASSWORD)
  await page.waitForURL('/')
  await page.goto('/musaitlik')
  await expect(page.getByText('Dr. Öğr. Üyesi Mehmet Öz')).toBeVisible()

  const start = nextTuesday()
  const [y, m, d] = start.split('-')
  const end = dayFromToday(Math.round((Date.parse(start) - Date.parse(dayFromToday(0))) / 86400000) + 14)
  const [ey, em, ed] = end.split('-')

  await page.getByRole('button', { name: 'Yeni kayıt' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByText('Her hafta').click()
  await dialog.getByPlaceholder('Başlangıç', { exact: true }).click()
  await dialog.getByPlaceholder('Başlangıç', { exact: true }).fill(`${d}.${m}.${y}`)
  await dialog.getByPlaceholder('Başlangıç', { exact: true }).press('Enter')
  await dialog.getByPlaceholder('Bitiş (boşsa süresiz)').fill(`${ed}.${em}.${ey}`)
  await dialog.getByPlaceholder('Bitiş (boşsa süresiz)').press('Enter')
  await dialog.getByText('Tekrar', { exact: true }).click()
  await dialog.getByLabel('Tüm gün').click()
  await dialog.getByPlaceholder('Başlangıç saati').fill('13:00')
  await dialog.getByPlaceholder('Bitiş saati').fill('17:00')
  await dialog.getByPlaceholder('Bitiş saati').press('Enter')
  await dialog.getByLabel('Neden').fill('Ders')
  await dialog.locator('.ant-modal-title').click()
  await dialog.getByRole('button', { name: 'Kaydet' }).click()
  await expect(page.getByText('Kayıt eklendi.')).toBeVisible()

  const token = await adminToken()
  const personeller = await api<{ id: number; ad: string }[]>('GET', '/api/AkademikPersonel', undefined, token)
  const mehmet = personeller.body.data.find((p) => p.ad === 'Mehmet Öz')!
  const busy = await api<number[]>('GET', `/api/AkademikPersonelMusaitlik/mesgul-personeller?tarih=${start}&baslangicSaati=14:00&bitisSaati=15:00`, undefined, token)
  expect(busy.body.data).toContain(mehmet.id)
  const free = await api<number[]>('GET', `/api/AkademikPersonelMusaitlik/mesgul-personeller?tarih=${start}&baslangicSaati=09:00&bitisSaati=10:00`, undefined, token)
  expect(free.body.data).not.toContain(mehmet.id)

  await page.getByText('Liste', { exact: true }).click()
  await expect(page.getByText(/^Her Salı/)).toBeVisible()
  await page.locator('.ant-table-thead .ant-checkbox-input').click()
  await page.getByRole('button', { name: /Seçilenleri sil \(1\)/ }).click()
  await page.getByRole('tooltip').getByRole('button', { name: 'Sil' }).click()
  await expect(page.getByText('Kayıt silindi.')).toBeVisible()
})
