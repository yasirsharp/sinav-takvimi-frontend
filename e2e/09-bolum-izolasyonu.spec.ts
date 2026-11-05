import { expect, test } from '@playwright/test'
import { adminToken, api, apiLogin, dayFromToday, login } from './helpers'

/**
 * Bölüm görevlisi yalnızca kendi bölümünü görür ve değiştirir. Mehmet Öz İnşaat bölümüne görevli atanır
 * (03-musaitlik testinde parolası belirlendi); Bilgisayar Mühendisliği ve ortak kayıtlara yazamaz.
 */
const MEHMET = { userName: 'mehmet.oz', password: 'Mehmet2026x' }

type Sinav = {
  id: number
  bolumAd: string
  dersBolumAkademikPersonelId: number
  sinavTarihi: string
  sinavBaslangicSaati: string
  sinavBitisSaati: string
  derslikler: { derslikId: number; gozetmenId: number | null }[]
}
const body = (s: Sinav) => ({
  id: s.id,
  dersBolumAkademikPersonelId: s.dersBolumAkademikPersonelId,
  sinavTarihi: s.sinavTarihi.slice(0, 10),
  sinavBaslangicSaati: s.sinavBaslangicSaati,
  sinavBitisSaati: s.sinavBitisSaati,
  derslikler: s.derslikler.map((d) => ({ derslikId: d.derslikId, gozetmenId: d.gozetmenId || null })),
})

test.describe.configure({ mode: 'serial' })

let admin: string
let gorevli: string
let insaatId: number
let gorevlilikId: number
const range = () => `startDate=${dayFromToday(-7)}&endDate=${dayFromToday(30)}T23:59:59`

test.beforeAll(async () => {
  admin = await adminToken()
  const bolumler = (await api<{ id: number; ad: string }[]>('GET', '/api/Bolum', undefined, admin)).body.data
  insaatId = bolumler.find((b) => b.ad === 'İnşaat Mühendisliği')!.id
  const personeller = (await api<{ id: number; ad: string }[]>('GET', '/api/AkademikPersonel', undefined, admin)).body.data
  const mehmet = personeller.find((p) => p.ad === 'Mehmet Öz')!
  expect(
    (await api('POST', '/api/bolumakademikpersoneller', { bolumId: insaatId, akademikPersonelId: mehmet.id, status: true }, admin)).status,
  ).toBeLessThan(300)
  const atamalar = (
    await api<{ id: number; bolumId: number; akademikPersonelId: number }[]>('GET', '/api/bolumakademikpersoneller', undefined, admin)
  ).body.data
  gorevlilikId = atamalar.find((a) => a.bolumId === insaatId && a.akademikPersonelId === mehmet.id)!.id

  // İnşaat'a ait bir sınav (TDL101 İnşaat ataması)
  const dbap = (await api<{ id: number; bolumId: number }[]>('GET', '/api/dbap/details', undefined, admin)).body.data
  const derslikler = (await api<{ derslikId: number; derslikAd: string }[]>('GET', '/api/Derslik/with-bolumler', undefined, admin)).body.data
  const created = await api(
    'POST',
    '/api/SinavDetay',
    {
      dersBolumAkademikPersonelId: dbap.find((d) => d.bolumId === insaatId)!.id,
      sinavTarihi: `${dayFromToday(3)}T00:00:00`,
      sinavBaslangicSaati: '14:00',
      sinavBitisSaati: '15:00',
      derslikler: [{ derslikId: derslikler.find((d) => d.derslikAd === 'MF-A102')!.derslikId, gozetmenId: null }],
    },
    admin,
  )
  expect(created.status).toBe(200)

  // Rol token'a girişte eklenir
  gorevli = await apiLogin(MEHMET.userName, MEHMET.password)
})

test('görevli yalnızca kendi bölümünün sınavlarını görür ve değiştirir', async () => {
  const hepsi = (await api<Sinav[]>('GET', `/api/SinavDetay/daterange?${range()}`, undefined, admin)).body.data
  const gorunen = (await api<Sinav[]>('GET', `/api/SinavDetay/daterange?${range()}`, undefined, gorevli)).body.data
  expect(gorunen.length).toBeGreaterThan(0)
  expect(gorunen.every((s) => s.bolumAd === 'İnşaat Mühendisliği')).toBe(true)

  const bilgisayar = hepsi.find((s) => s.bolumAd === 'Bilgisayar Mühendisliği')!
  const insaat = gorunen[0]
  expect((await api('PUT', '/api/SinavDetay', body(bilgisayar), gorevli)).status).toBe(403)
  expect((await api('DELETE', `/api/SinavDetay/${bilgisayar.id}`, undefined, gorevli)).status).toBe(403)
  expect((await api('GET', `/api/SinavDetay/${bilgisayar.id}`, undefined, gorevli)).status).toBe(403)
  expect((await api('GET', '/api/SinavDetay', undefined, gorevli)).status).toBe(403)
  expect((await api('PUT', '/api/SinavDetay', body(insaat), gorevli)).status).toBe(200)

  // Kendi sınavını başka bölümün ders atamasına taşıyamaz
  const moved = { ...body(insaat), dersBolumAkademikPersonelId: bilgisayar.dersBolumAkademikPersonelId }
  expect((await api('PUT', '/api/SinavDetay', moved, gorevli)).status).toBe(403)
})

test('görevli başka bölümün ve ortak kayıtların ders, derslik ve atamalarını değiştiremez', async () => {
  type Ders = { dersId: number; dersAd: string; kod: string; ortakDers: boolean; bolumler: { bolumId: number }[] }
  const dersler = (await api<Ders[]>('GET', '/api/Ders/with-bolumler', undefined, admin)).body.data
  const dersBody = (d: Ders) => ({ id: d.dersId, ad: d.dersAd, kod: d.kod, ortakDers: d.ortakDers, bolumIds: d.bolumler.map((b) => b.bolumId) })
  const blm201 = dersler.find((d) => d.kod === 'BLM201')!
  const tdl101 = dersler.find((d) => d.kod === 'TDL101')!
  expect((await api('PUT', '/api/Ders/with-bolumler', dersBody(blm201), gorevli)).status).toBe(403)
  expect((await api('PUT', '/api/Ders/with-bolumler', dersBody(tdl101), gorevli)).status).toBe(403) // ortak
  expect((await api('DELETE', `/api/Ders/${blm201.dersId}`, undefined, gorevli)).status).toBe(403)
  expect((await api('POST', '/api/Ders/with-bolumler', { ad: 'Yeni Ortak', kod: 'ORT999', ortakDers: true, bolumIds: [] }, gorevli)).status).toBe(403)
  const gorulen = (await api<Ders[]>('GET', '/api/Ders/with-bolumler', undefined, gorevli)).body.data
  expect(gorulen.map((d) => d.kod)).not.toContain('BLM201')

  type Derslik = { derslikId: number; derslikAd: string; kapasite: number; ortakDerslik: boolean; status: boolean; bolumler: { bolumId: number }[] }
  const derslikler = (await api<Derslik[]>('GET', '/api/Derslik/with-bolumler', undefined, admin)).body.data
  const dBody = (d: Derslik) => ({
    id: d.derslikId,
    ad: d.derslikAd,
    kapasite: d.kapasite,
    ortakDerslik: d.ortakDerslik,
    status: d.status,
    bolumIds: d.bolumler.map((b) => b.bolumId),
  })
  expect((await api('PUT', '/api/Derslik/with-bolumler', dBody(derslikler.find((d) => d.derslikAd === 'MF-A102')!), gorevli)).status).toBe(403) // ortak
  expect((await api('PUT', '/api/Derslik/with-bolumler', dBody(derslikler.find((d) => d.derslikAd === 'MF-A101')!), gorevli)).status).toBe(403) // Bilgisayar

  const dbap = (
    await api<{ id: number; dersId: number; bolumId: number; akademikPersonelId: number; bolumAd: string }[]>(
      'GET',
      '/api/dbap/details',
      undefined,
      admin,
    )
  ).body.data
  const blmAtama = dbap.find((d) => d.bolumAd === 'Bilgisayar Mühendisliği')!
  expect(
    (
      await api(
        'POST',
        '/api/dbap',
        { dersId: blmAtama.dersId, bolumId: blmAtama.bolumId, akademikPersonelId: blmAtama.akademikPersonelId, status: true },
        gorevli,
      )
    ).status,
  ).toBe(403)
  expect((await api('DELETE', `/api/dbap/${blmAtama.id}`, undefined, gorevli)).status).toBe(403)
})

test('çakışma kontrolünü atlayan ve kişisel veriye dokunan uçlar kapalı', async () => {
  const hepsi = (await api<Sinav[]>('GET', `/api/SinavDetay/daterange?${range()}`, undefined, admin)).body.data
  expect((await api('POST', '/api/SinavDerslik', { derslikId: 1, sinavDetayId: hepsi[0].id }, gorevli)).status).toBe(403)
  expect((await api('POST', '/api/Notification', { userId: 1, title: 'x', message: 'y', type: 'info' }, gorevli)).status).toBe(403)

  // Başkasının müsaitliği
  const personeller = (await api<{ id: number; ad: string }[]>('GET', '/api/AkademikPersonel', undefined, admin)).body.data
  const zeynep = personeller.find((p) => p.ad === 'Zeynep Çelik')!
  const kayit = await api<{ id: number }>(
    'POST',
    '/api/AkademikPersonelMusaitlik',
    {
      akademikPersonelId: zeynep.id,
      baslangicTarihi: `${dayFromToday(20)}T00:00:00`,
      bitisTarihi: null,
      baslangicSaati: null,
      bitisSaati: null,
      tekrarTipi: 0,
      isMusait: false,
      neden: 'İzin',
      aciklama: null,
    },
    admin,
  )
  expect(kayit.status).toBeLessThan(300)
  const zeynepKayitlari = (await api<{ id: number }[]>('GET', `/api/AkademikPersonelMusaitlik/personel/${zeynep.id}`, undefined, admin)).body.data
  expect((await api('DELETE', `/api/AkademikPersonelMusaitlik/${zeynepKayitlari[0].id}`, undefined, gorevli)).status).toBe(403)

  // Öğrenciler: görevli yalnızca kendi bölümü; akademik personel hiç
  const ogrenciler = (await api<{ bolumId: number }[]>('GET', '/api/Ogrenci', undefined, gorevli)).body.data
  expect(ogrenciler.every((o) => o.bolumId === insaatId)).toBe(true)
  expect((await api('GET', '/api/Ogrenci', undefined, await apiLogin('alican.yildiz', 'AliCan2026x'))).status).toBe(403)
})

test('arayüzde başka bölümün ve ortak kayıtların satırı kilitli', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sinav-takvimi.tour.disabled', '1'))
  await login(page, MEHMET.userName, MEHMET.password)
  await page.waitForURL('/')
  await page.goto('/tanimlar/dersler')
  const ortak = page.getByRole('row', { name: /TDL101/ })
  await expect(ortak).toBeVisible()
  await expect(ortak.getByRole('button', { name: /düzenle/ })).toHaveCount(0)
  await expect(ortak.getByLabel(/yalnızca yönetici/)).toBeVisible()
  await expect(page.getByRole('row', { name: /BLM201/ })).toHaveCount(0)
})

test('görevlilikten çıkarılınca elindeki token ile yazamaz', async () => {
  const gorunen = (await api<Sinav[]>('GET', `/api/SinavDetay/daterange?${range()}`, undefined, gorevli)).body.data
  const atama = (
    await api<{ id: number; bolumId: number; akademikPersonelId: number }[]>('GET', '/api/bolumakademikpersoneller', undefined, admin)
  ).body.data.find((a) => a.id === gorevlilikId)!
  expect((await api('DELETE', '/api/bolumakademikpersoneller', atama, admin)).status).toBe(200)
  expect((await api('PUT', '/api/SinavDetay', body(gorunen[0]), gorevli)).status).toBe(403)
})
