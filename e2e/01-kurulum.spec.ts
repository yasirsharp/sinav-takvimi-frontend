import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN, api, login } from './helpers'
import { OGRENCI_SAYISI, fixtureDir, writeFixtures } from './fixtures'

/**
 * Boş veritabanından başlayan kurulum: ilk yönetici girişi (zorunlu parola değişimi) ve tüm tanımların
 * Excel/CSV ile içe aktarılması. Sonraki testler bu verileri kullanır.
 */
test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await writeFixtures()
})

test('açık kayıt kapalı', async () => {
  const res = await api('POST', '/api/Auth/register', { email: 'x@x.com', userName: 'x', firstName: 'a', lastName: 'b', password: 'Aa123456' })
  expect(res.status).toBe(404)
})

test('ilk yönetici geçici parolayla girer ve parolasını değiştirmek zorundadır', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.initialPassword)
  await page.waitForURL('**/parola-degistir')
  await expect(page.locator('.du-main-menu')).toHaveCount(0)

  // Başka sayfaya gitmek mümkün değil
  await page.goto('/tanimlar/bolumler')
  await expect(page).toHaveURL(/parola-degistir/)

  // Backend de diğer uçları kapatır
  const token = await page.evaluate(() => localStorage.getItem('sinav-takvimi.token'))
  const blocked = await api('GET', '/api/Bolum', undefined, token!)
  expect(blocked.status).toBe(403)

  await page.getByLabel('Geçici parola').fill(ADMIN.initialPassword)
  await page.getByLabel('Yeni parola', { exact: true }).fill('zayif')
  await expect(page.getByText('Bir büyük harf')).toBeVisible()
  await page.getByLabel('Yeni parola', { exact: true }).fill(ADMIN.password)
  await page.getByLabel('Yeni parola (tekrar)').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Parolayı değiştir' }).click()
  await page.waitForURL('/')
  await expect(page.locator('.du-main-menu')).toBeVisible()
  await expect(page.getByText('Kurulum adımları')).toBeVisible()
})

async function importFile(page: Page, route: string, file: string, expected: { ready: number; invalid?: number; added: number }) {
  await page.goto(route)
  await page.getByRole('button', { name: "Excel'den aktar" }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type=file]').setInputFiles(path.join(fixtureDir, file))
  const summary = dialog.getByText(/satır ·/)
  await expect(summary).toContainText(`${expected.ready} hazır`)
  if (expected.invalid) await expect(summary).toContainText(`${expected.invalid} hatalı`)
  else await expect(summary).not.toContainText('hatalı')
  await dialog.getByRole('button', { name: `${expected.ready} satırı aktar` }).click()
  await expect(dialog.locator('.ant-result-title')).toContainText(`${expected.added} kayıt eklendi`, { timeout: 60_000 })
  return dialog
}

test('tanımlar Excel/CSV ile içe aktarılır', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password)
  await page.waitForURL('/')

  let dialog = await importFile(page, '/tanimlar/bolumler', 'bolum.xlsx', { ready: 3, invalid: 1, added: 3 })
  await dialog.getByRole('button', { name: 'Kapat' }).last().click()

  dialog = await importFile(page, '/tanimlar/derslikler', 'derslik.csv', { ready: 3, invalid: 1, added: 3 })
  await dialog.getByRole('button', { name: 'Kapat' }).last().click()

  dialog = await importFile(page, '/tanimlar/dersler', 'ders.xlsx', { ready: 4, added: 4 })
  await dialog.getByRole('button', { name: 'Kapat' }).last().click()

  dialog = await importFile(page, '/tanimlar/akademik-personel', 'personel.xlsx', { ready: 3, invalid: 1, added: 3 })
  await expect(dialog.getByText('zeynep.celik', { exact: true })).toBeVisible()
  const download = page.waitForEvent('download')
  await dialog.getByRole('button', { name: /Sonuç dosyasını indir/ }).click()
  const content = fs.readFileSync((await (await download).path())!, 'utf8')
  expect(content).toContain('Geçici parola')
  await dialog.getByRole('button', { name: 'Kapat' }).last().click()

  dialog = await importFile(page, '/tanimlar/ogrenciler', 'ogrenci.csv', { ready: OGRENCI_SAYISI, invalid: 2, added: OGRENCI_SAYISI })
  await dialog.getByRole('button', { name: 'Kapat' }).last().click()
  await expect(page.getByText(`Toplam ${OGRENCI_SAYISI} kayıt`)).toBeVisible()

  dialog = await importFile(page, '/tanimlar/ders-atamalari', 'dbap.xlsx', { ready: 3, invalid: 2, added: 3 })
  // Önizlemede hatalı olan satırlar da sonuç tablosunda nedeniyle listelenir
  await expect(dialog.getByText(/Bu ders bu bölümde verilmiyor/)).toBeVisible()
  await dialog.getByRole('button', { name: 'Kapat' }).last().click()

  // Kurulum tamamlanınca ana sayfada adımlar kaybolur
  await page.goto('/')
  await expect(page.getByText('Bu haftaki sınavlar')).toBeVisible()
  await expect(page.getByText('Kurulum adımları')).toHaveCount(0)
})
