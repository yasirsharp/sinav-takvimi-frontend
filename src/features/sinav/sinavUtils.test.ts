import { describe, expect, it } from 'vitest'
import type { SinavDetay } from '../../api/sinav'
import { bolumRengi, findCakismalar, hasGozetmen, overlaps, toDateTime } from './sinavUtils'

const sinav = (over: Partial<SinavDetay>): SinavDetay => ({
  id: 1,
  dersBolumAkademikPersonelId: 10,
  dersAd: 'Veri Yapıları',
  bolumId: 1,
  bolumAd: 'Bilgisayar',
  akademikPersonelAd: 'Ayşe Demir',
  unvan: 'Dr.',
  sinavTarihi: '2026-11-02T00:00:00',
  sinavBaslangicSaati: '10:00:00',
  sinavBitisSaati: '11:30:00',
  derslikler: [{ derslikId: 100, gozetmenId: 50 }],
  ...over,
})

const at = (hhmm: string) => toDateTime('2026-11-02', `${hhmm}:00`)
const dbapPersonel = new Map([
  [10, 5],
  [20, 6],
])

describe('sınav zaman yardımcıları', () => {
  it('tarih ve saati yerel zamana çevirir', () => {
    const d = toDateTime('2026-11-02T00:00:00', '09:30:00')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 10, 2, 9, 30])
  })

  it('biri bitince başlayan aralıklar çakışmaz', () => {
    expect(overlaps(at('10:00'), at('11:00'), at('11:00'), at('12:00'))).toBe(false)
    expect(overlaps(at('10:00'), at('11:01'), at('11:00'), at('12:00'))).toBe(true)
  })

  it('backend gözetmensiz derslik için 0 döner', () => {
    expect(hasGozetmen(0)).toBe(false)
    expect(hasGozetmen(null)).toBe(false)
    expect(hasGozetmen(7)).toBe(true)
  })

  it('bölüm rengi sabittir', () => {
    expect(bolumRengi(3)).toBe(bolumRengi(3))
  })
})

describe('findCakismalar', () => {
  const mevcut = [sinav({})]

  it('aynı saatte aynı dersliği bulur', () => {
    const c = findCakismalar({ start: at('11:00'), end: at('12:00'), derslikIds: [100], gozetmenIds: [] }, mevcut, dbapPersonel)
    expect(c.map((x) => x.tur)).toEqual(['derslik'])
  })

  it('gözetmen başka sınavda gözetmen veya dersin hocasıysa çakışır', () => {
    expect(
      findCakismalar({ start: at('10:30'), end: at('11:00'), derslikIds: [200], gozetmenIds: [50] }, mevcut, dbapPersonel).map((x) => x.tur),
    ).toEqual(['gozetmen'])
    expect(
      findCakismalar({ start: at('10:30'), end: at('11:00'), derslikIds: [200], gozetmenIds: [5] }, mevcut, dbapPersonel).map((x) => x.tur),
    ).toEqual(['gozetmen'])
  })

  it('dersin öğretim elemanının aynı saatte başka sınavı varsa çakışır', () => {
    const c = findCakismalar({ start: at('10:00'), end: at('11:00'), derslikIds: [200], gozetmenIds: [], personelId: 5 }, mevcut, dbapPersonel)
    expect(c.map((x) => x.tur)).toEqual(['ogretimElemani'])
  })

  it('düzenlenen sınavın kendisi ve farklı saatler çakışma sayılmaz', () => {
    expect(findCakismalar({ id: 1, start: at('10:00'), end: at('11:30'), derslikIds: [100], gozetmenIds: [50] }, mevcut, dbapPersonel)).toEqual([])
    expect(findCakismalar({ start: at('11:30'), end: at('12:30'), derslikIds: [100], gozetmenIds: [50] }, mevcut, dbapPersonel)).toEqual([])
  })
})
