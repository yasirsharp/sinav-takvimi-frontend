import { expect, test, type Page } from '@playwright/test'
import { adminToken, api, apiLogin, dayFromToday, login, loginAsAdmin, openedDialog, provisionUser } from './helpers'

/**
 * Roller ve kullanıcı değiştirme:
 * - Akademik personel (Ali Can Yıldız) yalnızca dersini verdiği ve gözetmen olduğu sınavları görür, değişiklik ister.
 * - Süper yönetici bölüm görevlisi Mehmet Öz olarak girer, talebi kabul eder, kendi hesabına döner ve hızlı geçiş yapar.
 * - Görevli personel (Zeynep Çelik) yalnızca atandığı bölümleri görür, hiçbir şeyi değiştiremez.
 */
const ALI = { userName: 'alican.yildiz', password: 'AliCan2026x' }
const ZEYNEP = { userName: 'zeynep.celik', password: 'Zeynep2026x' }

type Sinav = { id: number; sinavTarihi: string; bolumId: number; bolumAd: string; dersBolumAkademikPersonelId: number; derslikler: { derslikId: number; gozetmenId: number | null }[] }

test.describe.configure({ mode: 'serial' })

let admin: string
let ali: string
let aliPersonelId: number
let benimSinav: number
let digerSinav: number
let blmId: number
let eemId: number
let insaatId: number
const range = () => `startDate=${dayFromToday(-7)}&endDate=${dayFromToday(30)}T23:59:59`
const claim = (token: string, name: string) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())[name]
const userIdOf = (token: string) => Number(claim(token, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'))

/** Üst menü öğesi; rozetli öğenin adı sayıyla biter ("Talepler 1") */
async function menuItem(page: Page, name: string) {
  return page.locator('.du-main-menu').getByRole('menuitem', { name: new RegExp(`^${name}( \\d+)?$`) })
}

test.beforeAll(async () => {
  admin = await adminToken()
  const bolumler = (await api<{ id: number; ad: string }[]>('GET', '/api/Bolum', undefined, admin)).body.data
  blmId = bolumler.find((b) => b.ad === 'Bilgisayar Mühendisliği')!.id
  eemId = bolumler.find((b) => b.ad === 'Elektrik-Elektronik Mühendisliği')!.id
  insaatId = bolumler.find((b) => b.ad === 'İnşaat Mühendisliği')!.id
  const personeller = (await api<{ id: number; ad: string }[]>('GET', '/api/AkademikPersonel', undefined, admin)).body.data
  const zeynep = personeller.find((p) => p.ad === 'Zeynep Çelik')!
  const mehmet = personeller.find((p) => p.ad === 'Mehmet Öz')!
  aliPersonelId = personeller.find((p) => p.ad === 'Ali Can Yıldız')!.id

  // Mehmet Öz Bilgisayar Mühendisliği görevlisi olur
  expect(
    (await api('POST', '/api/bolumakademikpersoneller', { bolumId: blmId, akademikPersonelId: mehmet.id, status: true }, admin)).status,
  ).toBeLessThan(300)

  const dbap = (await api<{ id: number; akademikPersonelId: number; bolumId: number }[]>('GET', '/api/dbap/details', undefined, admin)).body.data
  const derslikler = (await api<{ id: number; ad: string }[]>('GET', '/api/Derslik', undefined, admin)).body.data
  const sinav = async (dbapId: number, start: string, end: string, derslik: string, gozetmenId: number | null) => {
    const res = await api<number>('POST', '/api/SinavDetay', {
      dersBolumAkademikPersonelId: dbapId,
      sinavTarihi: `${dayFromToday(6)}T00:00:00`,
      sinavBaslangicSaati: start,
      sinavBitisSaati: end,
      derslikler: [{ derslikId: derslikler.find((d) => d.ad === derslik)!.id, gozetmenId }],
    }, admin)
    expect(res.status, res.body?.message).toBe(200)
  }
  // Ali'nin gözetmen olduğu Bilgisayar sınavı ve Ali'nin hiç ilgisi olmayan bir sınav
  await sinav(dbap.find((d) => d.akademikPersonelId === zeynep.id && d.bolumId === blmId)!.id, '09:00', '10:00', 'MF-A102', aliPersonelId)
  await sinav(dbap.find((d) => d.akademikPersonelId === mehmet.id && d.bolumId === blmId)!.id, '13:00', '14:00', 'MF-A101', null)
  const hepsi = (await api<Sinav[]>('GET', `/api/SinavDetay/daterange?${range()}`, undefined, admin)).body.data
  const teacher = new Map(dbap.map((d) => [d.id, d.akademikPersonelId]))
  const oGun = hepsi.filter((s) => s.sinavTarihi.startsWith(dayFromToday(6)))
  benimSinav = oGun.find((s) => s.derslikler.some((d) => d.gozetmenId === aliPersonelId) && s.bolumId === blmId)!.id
  digerSinav = oGun.find((s) => teacher.get(s.dersBolumAkademikPersonelId) === mehmet.id && !s.derslikler.some((d) => d.gozetmenId === aliPersonelId))!.id

  await provisionUser(ZEYNEP.userName, ZEYNEP.password)
  ali = await apiLogin(ALI.userName, ALI.password)
})

test('akademik personel yalnızca kendi sınav görevlerini görür', async () => {
  const gorunen = (await api<Sinav[]>('GET', `/api/SinavDetay/daterange?${range()}`, undefined, ali)).body.data
  const ids = gorunen.map((s) => s.id)
  expect(ids).toContain(benimSinav)
  expect(ids).not.toContain(digerSinav)
  // Ders atamalarında yalnızca kendi dersleri, öğrenci listesi kapalı
  const dbap = (await api<{ akademikPersonelId: number }[]>('GET', '/api/dbap/details', undefined, ali)).body.data
  expect(dbap.every((d) => d.akademikPersonelId === aliPersonelId)).toBe(true)
  expect((await api('GET', '/api/Ogrenci', undefined, ali)).status).toBe(403)
  // Başkasının sınavı için talep açamaz
  expect((await api('POST', '/api/SinavTalep', { sinavDetayId: digerSinav, neden: 'Bu benim sınavım değil' }, ali)).status).toBe(403)
})

test('akademik personel sade menüyle girer ve sınavı için değişiklik ister', async ({ page }) => {
  await login(page, ALI.userName, ALI.password)
  await page.waitForURL('/')
  for (const name of ['Ana Sayfa', 'Sınavlarım', 'Müsaitliğim', 'Taleplerim']) await expect(await menuItem(page, name)).toBeVisible()
  for (const name of ['Tanımlar', 'Yönetim', 'Yardım', 'Bölümüm']) await expect(await menuItem(page, name)).toHaveCount(0)

  await page.goto(`/sinav-takvimi?sinav=${benimSinav}&tarih=${dayFromToday(6)}`)
  await expect(page.getByRole('heading', { name: 'Sınavlarım' })).toBeVisible()
  await expect(page.getByLabel('Bölüme göre filtrele')).toHaveCount(0)
  await page.getByRole('button', { name: 'Değişiklik iste' }).click()
  const dialog = await openedDialog(page, 'Değişiklik iste')
  await dialog.getByLabel('Ne değişmeli, neden?').fill('Aynı saatte başka kampüste dersim var, öğleden sonra olabilir mi?')
  await dialog.getByRole('button', { name: 'Gönder' }).click()
  await expect(page.getByText('Talebiniz bölüm görevlisine iletildi')).toBeVisible()

  await (await menuItem(page, 'Taleplerim')).click()
  await expect(page.getByRole('heading', { name: 'Taleplerim' })).toBeVisible()
  await expect(page.getByTestId('talep-listesi')).toContainText('Yanıt bekliyor')
  await expect(page.getByTestId('talep-listesi')).toContainText('öğleden sonra')
})

test('süper yönetici görevli olarak girer, talebi kabul eder, kendi hesabına döner ve hızlı geçiş yapar', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/yonetim/kullanicilar')
  await page.getByPlaceholder('Ad, kullanıcı adı veya e-posta ara…').fill('mehmet')
  await page.getByRole('button', { name: 'Mehmet Öz diğer işlemler' }).click()
  await page.getByRole('menuitem', { name: 'Bu kullanıcı olarak gir' }).click()

  const banner = page.getByTestId('impersonation-banner')
  await expect(banner).toContainText('Mehmet Öz olarak kullanıyorsunuz')
  await page.waitForURL('/')
  // Görevlinin menüsü: Talepler, Bölümüm, Duyurular; Yönetim yok
  for (const name of ['Sınav Takvimi', 'Talepler', 'Bölümüm', 'Duyurular']) await expect(await menuItem(page, name)).toBeVisible()
  await expect(await menuItem(page, 'Yönetim')).toHaveCount(0)

  await (await menuItem(page, 'Talepler')).click()
  const kart = page.getByTestId('talep-listesi').locator('.ant-card').filter({ hasText: 'öğleden sonra' })
  await expect(kart).toContainText('gözetmen')
  await kart.getByRole('button', { name: 'Kabul et' }).click()
  const dialog = await openedDialog(page, 'Talebi kabul et')
  await dialog.getByLabel('Yanıt notu').fill('14:00 oturumuna alıyorum.')
  await dialog.getByRole('button', { name: 'Kabul et' }).click()
  await expect(page.getByText(/Talep kabul edildi; hocaya bildirim gitti/)).toBeVisible()

  // "Sınavı aç" takvimde sınavın ayrıntısını açar; görevli kendi bölümünün sınavını düzenleyebilir
  await page.locator('.ant-segmented').getByText('Tümü', { exact: true }).click()
  await page.getByTestId('talep-listesi').locator('.ant-card').filter({ hasText: 'öğleden sonra' }).getByRole('button', { name: 'Sınavı aç' }).click()
  await expect(page.locator('.ant-drawer').getByRole('button', { name: 'Düzenle' })).toBeVisible()
  await page.keyboard.press('Escape')

  // Profil menüsü: parola değiştirme yok, "Kullanıcı değiştir → Kendi hesabıma dön"
  await page.getByRole('button', { name: /Mehmet Öz/ }).last().click()
  await expect(page.getByRole('menuitem', { name: 'Parolamı değiştir' })).toHaveCount(0)
  await page.getByRole('menuitem', { name: 'Kullanıcı değiştir' }).hover()
  await page.getByRole('menuitem', { name: /Kendi hesabıma dön/ }).click()
  await expect(banner).toHaveCount(0)
  await expect(page.getByText('Kendi hesabınıza döndünüz.')).toBeVisible()
  await expect(await menuItem(page, 'Yönetim')).toBeVisible()

  // Son kullanılanlardan tek tıkla tekrar geçiş, şeritten geri dönüş
  await page.locator('[data-tour="user-menu"]').click()
  await page.getByRole('menuitem', { name: 'Kullanıcı değiştir' }).hover()
  await page.getByRole('menuitem', { name: /Mehmet Öz/ }).click()
  await expect(banner).toContainText('Mehmet Öz olarak kullanıyorsunuz')
  await banner.getByRole('button', { name: 'Kendi hesabıma dön' }).click()
  await expect(banner).toHaveCount(0)
})

test('hoca yanıtı bildirim olarak alır; kişi olarak girme kuralları sunucuda denetlenir', async () => {
  const bildirimler = (await api<{ title: string; message: string }[]>('GET', `/api/Notification/user/${userIdOf(ali)}`, undefined, ali)).body.data
  expect(bildirimler.some((b) => b.title === 'Değişiklik talebiniz kabul edildi' && b.message.includes('14:00 oturumuna'))).toBe(true)

  const users = (await api<{ id: number; userName: string }[]>('GET', '/api/User/with-roles', undefined, admin)).body.data
  const mehmetUser = users.find((u) => u.userName === 'mehmet.oz')!
  const res = await api<{ token: string }>('POST', `/api/Auth/impersonate/${mehmetUser.id}`, undefined, admin)
  expect(res.status).toBe(200)
  const asMehmet = res.body.data.token
  expect(claim(asMehmet, 'act_as_by')).toBe(String(userIdOf(admin)))
  // Kişi olarak girilmişken parola değiştirilemez; kendine geçilemez; normal kullanıcı kimseye geçemez
  expect((await api('POST', '/api/Auth/change-password', { currentPassword: 'x', newPassword: 'YeniParola2026!' }, asMehmet)).status).toBe(403)
  expect((await api('POST', `/api/Auth/impersonate/${userIdOf(admin)}`, undefined, admin)).status).toBe(403)
  expect((await api('POST', `/api/Auth/impersonate/${mehmetUser.id}`, undefined, ali)).status).toBe(403)
  // Dönüş: süper yöneticinin kendi token'ı
  const back = await api<{ token: string }>('POST', '/api/Auth/stop-impersonation', undefined, asMehmet)
  expect(back.status).toBe(200)
  expect(userIdOf(back.body.data.token)).toBe(userIdOf(admin))
  expect(claim(back.body.data.token, 'act_as_by')).toBeUndefined()
})

test('görevli personel birden çok bölüme atanır ve yalnızca onları görür', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/yonetim/kullanicilar')
  await page.getByPlaceholder('Ad, kullanıcı adı veya e-posta ara…').fill('zeynep')
  await page.getByRole('button', { name: 'Zeynep Çelik roller' }).click()
  const bolumler = page.getByTestId('gp-bolumleri')
  await expect(bolumler).toContainText('Bölüm seçilmedi')
  await bolumler.getByLabel('Görevli personelin bölümleri').click()
  await page.locator('.ant-select-item-option').filter({ hasText: 'Elektrik-Elektronik Mühendisliği' }).click()
  await expect(page.getByText('Bölümler kaydedildi').first()).toBeVisible()
  await page.locator('.ant-select-item-option').filter({ hasText: 'İnşaat Mühendisliği' }).click()
  await expect(bolumler).not.toContainText('Bölüm seçilmedi')

  const zeynep = await apiLogin(ZEYNEP.userName, ZEYNEP.password)
  expect(
    (await api<number[]>('GET', `/api/User/${userIdOf(zeynep)}/okuma-bolumleri`, undefined, admin)).body.data.sort(),
  ).toEqual([eemId, insaatId].sort())
  const ogrenciler = (await api<{ bolumId: number }[]>('GET', '/api/Ogrenci', undefined, zeynep)).body.data
  expect(ogrenciler.length).toBeGreaterThan(0)
  expect(ogrenciler.every((o) => o.bolumId === eemId || o.bolumId === insaatId)).toBe(true)
  // Salt okunur: sınav ekleyemez, öğrenci silemez
  expect((await api('POST', '/api/SinavDetay', { dersBolumAkademikPersonelId: 1, sinavTarihi: `${dayFromToday(8)}T00:00:00`, sinavBaslangicSaati: '09:00', sinavBitisSaati: '10:00', derslikler: [] }, zeynep)).status).toBe(403)

  // Açık kalan bölüm listesi Escape ile kapanır, sonra pencere
  await bolumler.getByLabel('Görevli personelin bölümleri').press('Escape')
  await expect(page.locator('.ant-select-dropdown:visible')).toHaveCount(0)
  await page.getByRole('dialog').getByRole('button', { name: 'Kapat', exact: true }).last().click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.locator('[data-tour="user-menu"]').click()
  await page.getByRole('menuitem', { name: 'Çıkış yap' }).click()
  await login(page, ZEYNEP.userName, ZEYNEP.password)
  await page.waitForURL('/')
  await expect(await menuItem(page, 'Bölümüm')).toBeVisible()
  await expect(await menuItem(page, 'Yönetim')).toHaveCount(0)
  await expect(await menuItem(page, 'Talepler')).toHaveCount(0)
  await (await menuItem(page, 'Bölümüm')).hover()
  await page.getByRole('menuitem', { name: 'Öğrenciler' }).click()
  await expect(page.getByRole('button', { name: /düzenle/ })).toHaveCount(0)
})
