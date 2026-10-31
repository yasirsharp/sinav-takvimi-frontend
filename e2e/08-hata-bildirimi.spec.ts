import { expect, test } from '@playwright/test'
import { api, apiLogin, loginAsAdmin } from './helpers'

test('Alt+Shift+H ile ekran görüntülü hata bildirimi; yönetici inceler ve çözer', async ({ page }) => {
  // Her çalıştırmada benzersiz (tekrar çalıştırmada eski kayıtlarla karışmasın)
  const text = `E2E ${Date.now()}: takvimde sınav sürüklenince eski yerine döndü`
  await loginAsAdmin(page)
  await page.goto('/sinav-takvimi')
  await expect(page.getByRole('heading', { name: 'Sınav Takvimi' })).toBeVisible()
  const dialog = page.getByRole('dialog', { name: 'Hata bildir' })

  // Tarayıcının Alt+H kısayolu karışmaz
  await page.keyboard.press('Alt+KeyH')
  await page.waitForTimeout(500)
  await expect(dialog).toBeHidden()

  await page.keyboard.press('Alt+Shift+KeyH')
  await expect(dialog).toBeVisible({ timeout: 20_000 })
  const preview = dialog.getByAltText('Gönderilecek ekran görüntüsü')
  await expect(preview).toBeVisible()
  expect(await preview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(300)

  await dialog.getByLabel('Ne yapıyordunuz, ne oldu?').fill(text)
  await dialog.getByRole('button', { name: 'Gönder' }).click()
  await expect(dialog.getByText(/bildiriminiz alındı \(No: \d+\)/)).toBeVisible()
  await dialog.locator('.ant-modal-footer').getByRole('button', { name: 'Kapat' }).click()

  // Köşedeki düğme de aynı pencereyi açar
  await page.getByRole('button', { name: 'Hata bildir' }).click()
  await expect(dialog).toBeVisible({ timeout: 20_000 })
  await dialog.getByRole('button', { name: 'Vazgeç' }).click()

  // Yönetici ekranı
  await page.goto('/yonetim/hata-bildirimleri')
  const row = page.getByRole('row', { name: new RegExp(text.slice(0, 18)) })
  await expect(row).toBeVisible()
  await expect(row).toContainText('Yeni')
  await row.click()
  const drawer = page.getByRole('dialog', { name: /Hata bildirimi #\d+/ })
  const image = drawer.getByAltText(/ekran görüntüsü/)
  await expect(image).toBeVisible()
  expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(300)
  await expect(drawer).toContainText('/sinav-takvimi')
  await expect(drawer).toContainText('Sistem Yöneticisi')

  await drawer.getByLabel('Durum').click()
  await page.locator('.ant-select-item-option').filter({ hasText: 'Çözüldü' }).click()
  await drawer.getByLabel('Not').fill('E2E ile kontrol edildi')
  await drawer.getByRole('button', { name: 'Kaydet' }).click()
  await expect(page.getByText('Kaydedildi.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()

  // SMTP ayarlıysa deneme e-postası gider, değilse nedeni anlatılır
  await page.getByRole('button', { name: 'Test e-postası gönder' }).click()
  await expect(page.getByText(/Test e-postası gönderildi|E-posta ayarlı değil/)).toBeVisible({ timeout: 40_000 })

  await page.getByText('Çözüldü', { exact: true }).first().click()
  await expect(page.getByRole('row', { name: new RegExp(text.slice(0, 18)) })).toContainText('Çözüldü')
})

test('hata bildirimleri yalnızca yöneticiye açık; herkes gönderebilir', async () => {
  const token = await apiLogin('2026100001', 'Ogrenci2026x')
  expect((await api('GET', '/api/BugReport', undefined, token)).status).toBe(403)
  expect((await api('GET', '/api/BugReport/1/screenshot', undefined, token)).status).toBe(403)
})
