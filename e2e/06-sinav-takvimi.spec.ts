import { expect, test } from '@playwright/test'
import { dayFromToday, loginAsAdmin } from './helpers'

test('planlayıcı formdan sınav ekler, takvimde görür ve siler', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/sinav-takvimi')
  const tarih = dayFromToday(2)
  const [y, m, d] = tarih.split('-')

  await page.getByRole('button', { name: 'Yeni sınav' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Bölüm').click()
  await page.getByTitle('Bilgisayar Mühendisliği').last().click()
  await dialog.getByLabel('Ders (öğretim elemanıyla)').click()
  await page.getByTitle(/Algoritmalar/).last().click()
  await dialog.getByLabel('Tarih').fill(`${d}.${m}.${y}`)
  await dialog.getByLabel('Tarih').press('Enter')
  await dialog.getByPlaceholder('Başlangıç').fill('14:00')
  await dialog.getByPlaceholder('Başlangıç').press('Enter')
  await dialog.getByPlaceholder('Bitiş').fill('16:00')
  await dialog.getByPlaceholder('Bitiş').press('Enter')
  await dialog.getByLabel('1. derslik').click()
  await page.getByTitle(/MF-B201/).last().click()
  await dialog.getByLabel('1. gözetmen').click()
  await page.getByTitle(/Zeynep Çelik/).last().click()
  await dialog.locator('.ant-modal-title').click()
  await dialog.getByRole('button', { name: 'Kaydet' }).click()
  await expect(page.getByText('Sınav eklendi.')).toBeVisible()

  // Liste görünümünde sınavı bul (gerekirse sonraki haftaya geç)
  await page.getByRole('button', { name: 'Liste' }).click()
  for (let i = 0; i < 2 && !(await page.getByText(/Algoritmalar/).first().isVisible()); i++) {
    await page.locator('.fc-next-button').click()
    await page.waitForTimeout(800)
  }
  await page.getByText(/Algoritmalar/).first().click()
  const drawer = page.locator('.ant-drawer')
  await expect(drawer).toContainText('MF-B201')
  await expect(drawer).toContainText('Zeynep Çelik')

  await drawer.getByRole('button', { name: 'Sil' }).click()
  await page.getByRole('tooltip').getByRole('button', { name: 'Sil' }).click()
  await expect(page.getByText('Sınav silindi.')).toBeVisible()
})
