import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../api/client'
import { renderWithProviders } from '../../test/renderWithProviders'
import DersPage from './DersPage'

const dersler = [
  { dersId: 1, dersAd: 'Veri Yapıları', kod: 'BLM201', ortakDers: false, bolumler: [{ bolumId: 1, bolumAd: 'Bilgisayar Mühendisliği' }] },
  { dersId: 2, dersAd: 'Türk Dili', kod: 'TDL101', ortakDers: true, bolumler: [] },
  { dersId: 3, dersAd: 'Statik', kod: 'INS101', ortakDers: false, bolumler: [{ bolumId: 2, bolumAd: 'İnşaat Mühendisliği' }] },
]
const bolumler = [
  { id: 1, ad: 'Bilgisayar Mühendisliği' },
  { id: 2, ad: 'İnşaat Mühendisliği' },
]

function mockApi() {
  vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
    if (url === '/api/Ders/with-bolumler') return { data: { success: true, data: dersler } }
    if (url === '/api/Bolum') return { data: { success: true, data: bolumler } }
    if (url === '/api/Ders/check-kod-unique') return { data: { success: true, data: true } }
    throw new Error(`beklenmeyen istek: ${url}`)
  })
}

describe('DersPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockApi()
  })

  it('dersleri listeler ve Türkçe arama yapar', async () => {
    renderWithProviders(<DersPage />)
    expect(await screen.findByText('Veri Yapıları')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Tabloda ara'), 'İNS')
    expect(screen.queryByText('Veri Yapıları')).not.toBeInTheDocument()
    expect(screen.getByText('Statik')).toBeInTheDocument()
  })

  it('bölüm görevlisi kendi bölümüyle filtrelenmiş başlar; ortak dersler de görünür', async () => {
    renderWithProviders(<DersPage />, { roles: ['bolum.gorevlisi'], bolumIds: [1] })
    expect(await screen.findByText('Veri Yapıları')).toBeInTheDocument()
    expect(screen.getByText('Türk Dili')).toBeInTheDocument()
    expect(screen.queryByText('Statik')).not.toBeInTheDocument()
  })

  it('yazma yetkisi olmayan kullanıcı Yeni ders düğmesini görmez', async () => {
    renderWithProviders(<DersPage />, { roles: ['akademik.personel'] })
    expect(await screen.findByText('Veri Yapıları')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /yeni ders/i })).not.toBeInTheDocument()
  })

  it('ortak ders seçilince bölüm alanı gizlenir ve kod büyük harfe çevrilir', async () => {
    renderWithProviders(<DersPage />)
    await userEvent.click(await screen.findByRole('button', { name: /yeni ders/i }))
    const dialog = await screen.findByRole('dialog')

    const kod = within(dialog).getByLabelText('Ders kodu')
    await userEvent.type(kod, 'fiz 101')
    expect(kod).toHaveValue('FIZ101')

    expect(within(dialog).getByText('Bölümler')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('switch'))
    expect(within(dialog).queryByText('Bölümler')).not.toBeInTheDocument()
  })
})
