import { describe, expect, it } from 'vitest'
import { Roles } from '../auth/roles'
import { faq, tours } from './tours'
import { GENEL_TOUR_ID, isSeen, markSeen, resetSeen, searchFaq, searchTours, stepsForRoles, tourForPath, toursForRoles } from './tourModel'
import { flattenNavigation } from '../layout/navigation'

const yonetici = [Roles.Admin]
const ogrenci = [Roles.Ogrenci]
const akademik = [Roles.AkademikPersonel]

describe('tur kaydı', () => {
  it('her menü sayfasının bir turu var (yardım hariç)', () => {
    const paths = flattenNavigation()
      .map((i) => i.path)
      .filter((p) => p !== '/yardim')
    for (const p of paths) expect(tourForPath(tours, p), p).toBeDefined()
  })

  it('tur kimlikleri benzersiz', () => {
    expect(new Set(tours.map((t) => t.id)).size).toBe(tours.length)
  })

  it('öğrenci yönetim ve tanım turlarını görmez', () => {
    const ids = toursForRoles(tours, ogrenci).map((t) => t.id)
    expect(ids).toContain(GENEL_TOUR_ID)
    expect(ids).toContain('sinav-takvimi')
    expect(ids).not.toContain('kullanicilar')
    expect(ids).not.toContain('dersler')
    expect(ids).not.toContain('musaitlik')
  })

  it('adımlar role göre süzülür', () => {
    const sinav = tours.find((t) => t.id === 'sinav-takvimi')!
    const titles = (roles: string[]) => stepsForRoles(sinav, roles).map((s) => s.title)
    expect(titles(yonetici)).toContain('Yeni sınav')
    expect(titles(akademik)).not.toContain('Yeni sınav')
    expect(titles(akademik)).toContain('Sadece benim sınavlarım')
    expect(titles(ogrenci)).not.toContain('Sadece benim sınavlarım')
  })

  it('genel turda her rol için tek bir menü adımı var', () => {
    const genel = tours.find((t) => t.id === GENEL_TOUR_ID)!
    for (const roles of [yonetici, ogrenci, akademik]) {
      expect(stepsForRoles(genel, roles).filter((s) => s.target === 'menu')).toHaveLength(1)
    }
  })
})

describe('arama', () => {
  it('Türkçe büyük/küçük harf duyarsız; adım metinlerinde de arar', () => {
    const found = searchTours(toursForRoles(tours, yonetici), 'PAROLA SIFIRLA', yonetici).map((t) => t.id)
    expect(found).toContain('kullanicilar')
    expect(searchTours(tours, 'İÇE AKTARMA', yonetici).length + searchTours(tours, "excel'den", yonetici).length).toBeGreaterThan(0)
    expect(searchTours(tours, 'sürükle', yonetici).map((t) => t.id)).toContain('sinav-takvimi')
  })

  it('başlığı veya anahtar kelimesi eşleşen konu önce gelir', () => {
    expect(searchTours(tours, 'müsait değilim', yonetici)[0].id).toBe('musaitlik')
  })

  it('rolün göremediği adımlarda eşleşme sayılmaz', () => {
    const sinav = tours.filter((t) => t.id === 'sinav-takvimi')
    expect(searchTours(sinav, 'çakışma kontrolü', yonetici)).toHaveLength(1)
    expect(searchTours(sinav, 'çakışma kontrolü', ogrenci)).toHaveLength(0)
  })

  it('sık sorulanlar role göre süzülür', () => {
    expect(searchFaq(faq, 'excel', yonetici).length).toBeGreaterThan(0)
    expect(searchFaq(faq, 'excel', ogrenci)).toHaveLength(0)
    expect(searchFaq(faq, 'parolamı unuttum', ogrenci)).toHaveLength(1)
  })
})

describe('görüldü bilgisi', () => {
  it('kullanıcıya göre saklanır ve sıfırlanır', () => {
    expect(isSeen(1, GENEL_TOUR_ID)).toBe(false)
    markSeen(1, GENEL_TOUR_ID)
    markSeen(1, 'dersler')
    expect(isSeen(1, GENEL_TOUR_ID)).toBe(true)
    expect(isSeen(2, GENEL_TOUR_ID)).toBe(false)
    resetSeen(1)
    expect(isSeen(1, GENEL_TOUR_ID)).toBe(false)
    expect(isSeen(1, 'dersler')).toBe(false)
  })
})
