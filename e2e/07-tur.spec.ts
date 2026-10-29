import { expect, test } from '@playwright/test'
import { loginAsAdmin } from './helpers'

// Bu dosyada turlar kendiliğinden açılabilir (diğer testlerde kapalıdır)
test.use({ storageState: { cookies: [], origins: [] } })

test('ilk girişte genel tur, sayfa turları ve yardım merkezi', async ({ page }) => {
  const tour = page.locator('.ant-tour')

  await loginAsAdmin(page)
  await expect(tour.getByText('Sınav Takvimi Sistemine hoş geldiniz')).toBeVisible()
  await tour.getByRole('button', { name: 'Sonraki' }).click()
  await expect(tour.getByText('Ana menü')).toBeVisible()
  await tour.getByRole('button', { name: 'Turu kapat' }).click()
  await expect(tour).toBeHidden()

  // Kapatılan tur bir daha kendiliğinden açılmaz
  await page.reload()
  await expect(page.getByRole('heading', { name: /Hoş geldiniz/ })).toBeVisible()
  await page.waitForTimeout(2500)
  await expect(tour).toBeHidden()

  // Sayfaya ilk girişte o sayfanın turu açılır; "?" ile tekrar açılır
  await page.goto('/tanimlar/dersler')
  await expect(tour.getByText('Yeni ders', { exact: true })).toBeVisible()
  await tour.getByRole('button', { name: 'Turu kapat' }).click()
  await page.getByRole('button', { name: 'Bu sayfanın turunu başlat' }).click()
  await expect(tour.getByText('Yeni ders', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tour).toBeHidden()

  // Yardım merkezinde arayıp ilgili ekranın turunu başlatma
  await page.getByRole('button', { name: 'Yardım', exact: true }).click()
  await expect(page).toHaveURL(/\/yardim$/)
  await page.getByLabel('Yardımda ara').fill('parola sıfırla')
  await expect(page.getByText('Derslikler')).toBeHidden()
  await page.getByRole('button', { name: 'Sayfaya git ve turu başlat' }).first().click()
  await expect(page).toHaveURL(/\/yonetim\/kullanicilar$/)
  await expect(tour.getByText('Hesaplar nereden gelir?')).toBeVisible()
  await page.keyboard.press('Escape')

  // Hesap menüsünden genel tur tekrar başlatılır
  await page.getByRole('button', { name: /Sistem Yöneticisi/ }).click()
  await page.getByRole('menuitem', { name: 'Tanıtım turunu başlat' }).click()
  await expect(page).toHaveURL('/')
  await expect(tour.getByText('Sınav Takvimi Sistemine hoş geldiniz')).toBeVisible()
})
