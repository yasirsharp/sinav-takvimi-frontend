import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../api/client'
import type { DbapDetail } from '../../api/dbap'
import type { DersWithBolumler } from '../../api/ders'
import { renderWithProviders } from '../../test/renderWithProviders'
import { derslerForBolum, isDuplicateDbap, unassignedDersler } from './dbapRules'
import DbapPage from './DbapPage'

const dersler: DersWithBolumler[] = [
  { dersId: 1, dersAd: 'Veri Yapıları', kod: 'BLM201', ortakDers: false, bolumler: [{ bolumId: 1, bolumAd: 'Bilgisayar' }] },
  { dersId: 2, dersAd: 'Türk Dili', kod: 'TDL101', ortakDers: true, bolumler: [] },
  { dersId: 3, dersAd: 'Statik', kod: 'INS101', ortakDers: false, bolumler: [{ bolumId: 2, bolumAd: 'İnşaat' }] },
  { dersId: 4, dersAd: 'Algoritmalar', kod: 'BLM305', ortakDers: false, bolumler: [{ bolumId: 1, bolumAd: 'Bilgisayar' }] },
]
const dbap: DbapDetail[] = [
  { id: 10, dersId: 1, dersAd: 'Veri Yapıları', dersKodu: 'BLM201', bolumId: 1, bolumAd: 'Bilgisayar', akademikPersonelId: 5, akademikPersonelAd: 'Ayşe Demir', unvan: 'Dr. Öğr. Üyesi' },
  { id: 11, dersId: 3, dersAd: 'Statik', dersKodu: 'INS101', bolumId: 2, bolumAd: 'İnşaat', akademikPersonelId: 6, akademikPersonelAd: 'Mehmet Yılmaz', unvan: 'Prof. Dr.' },
]

describe('dbap kuralları', () => {
  it('bölümün derslerini ve ortak dersleri listeler', () => {
    expect(derslerForBolum(dersler, 1).map((d) => d.dersId)).toEqual([1, 2, 4])
    expect(derslerForBolum(dersler, undefined)).toEqual([])
  })

  it('aynı ders-bölüm-personel üçlüsünü tekrar sayar, düzenlenen kaydı hariç tutar', () => {
    expect(isDuplicateDbap(dbap, { dersId: 1, bolumId: 1, akademikPersonelId: 5 })).toBe(true)
    expect(isDuplicateDbap(dbap, { dersId: 1, bolumId: 1, akademikPersonelId: 5 }, 10)).toBe(false)
    expect(isDuplicateDbap(dbap, { dersId: 1, bolumId: 1, akademikPersonelId: 6 })).toBe(false)
  })

  it('atanmamış dersleri bulur (ortak dersler hariç), bölüm filtresine uyar', () => {
    expect(unassignedDersler(dersler, dbap, []).map((m) => m.ders.kod)).toEqual(['BLM305'])
    expect(unassignedDersler(dersler, dbap, [2])).toEqual([])
  })
})

describe('DbapPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      const data: Record<string, unknown> = {
        '/api/dbap/details': dbap,
        '/api/Ders/with-bolumler': dersler,
        '/api/AkademikPersonel': [
          { id: 5, ad: 'Ayşe Demir', unvan: 'Dr. Öğr. Üyesi', userId: 1 },
          { id: 6, ad: 'Mehmet Yılmaz', unvan: 'Prof. Dr.', userId: 2 },
        ],
        '/api/Bolum': [
          { id: 1, ad: 'Bilgisayar' },
          { id: 2, ad: 'İnşaat' },
        ],
      }
      if (!(url in data)) throw new Error(`beklenmeyen istek: ${url}`)
      return { data: { success: true, data: data[url] } }
    })
  })

  it('atamaları listeler ve atanmamış ders uyarısı gösterir', async () => {
    renderWithProviders(<DbapPage />)
    expect(await screen.findByText('Veri Yapıları')).toBeInTheDocument()
    expect(await screen.findByText(/1 ders için henüz öğretim elemanı atanmamış/)).toBeInTheDocument()
  })

  it('aynı atamayı ikinci kez kaydetmeye izin vermez', async () => {
    const post = vi.spyOn(apiClient, 'post')
    renderWithProviders(<DbapPage />, { roles: ['bolum.gorevlisi'], bolumIds: [1] })
    await userEvent.click(await screen.findByRole('button', { name: /yeni atama/i }))
    const dialog = await screen.findByRole('dialog')

    // Bölüm, görevlinin tek bölümüyle önceden seçili gelir
    const [, dersSelect, personelSelect] = within(dialog).getAllByRole('combobox')
    await userEvent.click(dersSelect)
    await userEvent.click(await screen.findByTitle('BLM201 Veri Yapıları'))
    await userEvent.click(personelSelect)
    await userEvent.click(await screen.findByTitle('Dr. Öğr. Üyesi Ayşe Demir'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Kaydet' }))

    expect(await within(dialog).findByText('Bu ders bu bölümde zaten bu öğretim elemanına atanmış.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })
})
