import { expect, test } from '@playwright/test'
import { adminToken, api, apiLogin, loginAsAdmin } from './helpers'

test.describe.configure({ mode: 'serial' })

test('öğrenci eklenir, geçici parola gösterilir, pasifleştirilince giriş yapamaz', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/tanimlar/ogrenciler')
  await page.getByRole('button', { name: 'Yeni öğrenci' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Öğrenci numarası').fill('2026500001')
  await dialog.getByLabel('Ad', { exact: true }).fill('Kerem')
  await dialog.getByLabel('Soyad').fill('Işık')
  await dialog.getByLabel('Bölüm').click()
  await page.getByTitle('Bilgisayar Mühendisliği').last().click()
  await dialog.getByRole('button', { name: 'Kaydet' }).click()

  const credentials = page.getByRole('dialog', { name: 'Öğrenci eklendi' })
  await expect(credentials).toContainText('2026500001')
  const password = (await credentials.locator('code').textContent())!.trim()
  await credentials.getByRole('button', { name: 'Bilgileri kaydettim' }).click()

  // Geçici parolayla API girişi mümkün, token'da pwd_change var
  const token = await apiLogin('2026500001', password)
  expect(JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).pwd_change).toBe('true')

  await page.getByPlaceholder('Öğrenci no veya ad ara…').fill('2026500001')
  await page.getByRole('button', { name: 'Kerem Işık düzenle' }).click()
  await page.getByRole('dialog').getByLabel('Aktif').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Kaydet' }).click()
  await expect(page.getByText('pasif', { exact: true })).toBeVisible()
  const res = await api('POST', '/api/Auth/login', { userName: '2026500001', password })
  expect(res.status).toBe(400)
})

test('kullanıcı yönetimi: rol ekleme, parola sıfırlama, kendi hesabını koruma', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/yonetim/kullanicilar')
  const search = page.getByPlaceholder('Ad, kullanıcı adı veya e-posta ara…')

  await search.fill('zeynep')
  await page.getByRole('button', { name: 'Zeynep Çelik roller' }).click()
  await page.getByRole('checkbox', { name: /Görevli Personel/ }).click()
  await expect(page.getByText('Görevli Personel rolü eklendi.')).toBeVisible()
  await page.getByRole('button', { name: 'Kapat', exact: true }).last().click()
  await expect(page.locator('.ant-table-row').getByText('Görevli Personel')).toBeVisible()

  await page.getByRole('button', { name: 'Zeynep Çelik parola sıfırla' }).click()
  await page.getByRole('button', { name: 'Sıfırla', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Parola sıfırlandı' })).toContainText('zeynep.celik')
  await page.getByRole('button', { name: 'Bilgileri kaydettim' }).click()
  await expect(page.getByText('İlk girişte parola değiştirecek')).toBeVisible()

  await search.fill('admin')
  await expect(page.getByRole('switch', { name: /aktif/ }).first()).toBeDisabled()
})

test('geçici parolalı kullanıcı API\'de sadece parola değiştirme ve kendi bilgisine erişir', async () => {
  const token = await adminToken()
  const users = await api<{ id: number; userName: string }[]>('GET', '/api/User/with-roles', undefined, token)
  const mehmet = users.body.data.find((u) => u.userName === 'mehmet.oz')!
  const reset = await api<{ temporaryPassword: string }>('POST', `/api/User/${mehmet.id}/reset-password`, undefined, token)
  const temp = await apiLogin('mehmet.oz', reset.body.data.temporaryPassword)
  expect((await api('GET', '/api/Bolum', undefined, temp)).status).toBe(403)
  expect((await api('GET', '/api/User/me', undefined, temp)).status).toBe(200)
})
