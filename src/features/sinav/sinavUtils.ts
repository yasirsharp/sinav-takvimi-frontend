import dayjs, { type Dayjs } from 'dayjs'
import type { SinavDetay } from '../../api/sinav'

/** "2026-01-12T00:00:00" + "09:30:00" → yerel Date */
export function toDateTime(tarih: string, saat: string): Date {
  return dayjs(`${tarih.slice(0, 10)}T${saat.slice(0, 8)}`).toDate()
}

export const formatDateParam = (d: Dayjs | Date) => dayjs(d).format('YYYY-MM-DD')
export const formatTimeParam = (d: Dayjs | Date) => dayjs(d).format('HH:mm:ss')

/** Backend gözetmensiz derslik için 0 döndürür */
export const hasGozetmen = (id: number | null | undefined): id is number => !!id && id > 0

/** İki saat aralığı kesişiyor mu? (biri bitince diğeri başlıyorsa kesişmez) */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd
}

export interface SinavAday {
  id?: number
  start: Date
  end: Date
  derslikIds: number[]
  gozetmenIds: number[]
  /** Dersi veren öğretim elemanı (DBAP üzerinden) */
  personelId?: number
}

export interface Cakisma {
  tur: 'derslik' | 'gozetmen' | 'ogretimElemani'
  sinav: SinavDetay
  /** İlgili derslik veya personel ID'si */
  kaynakId: number
}

/**
 * Aday sınavın mevcut sınavlarla çakışmalarını bulur (backend'deki kurala paralel):
 * aynı saatte aynı derslik, aynı gözetmen veya aynı öğretim elemanının başka sınavı.
 * Gözetmen, başka bir sınavın dersini veren öğretim elemanıysa da çakışma sayılır.
 */
export function findCakismalar(
  aday: SinavAday,
  sinavlar: SinavDetay[],
  dbapPersonel: Map<number, number>,
): Cakisma[] {
  const result: Cakisma[] = []
  for (const sinav of sinavlar) {
    if (sinav.id === aday.id) continue
    const start = toDateTime(sinav.sinavTarihi, sinav.sinavBaslangicSaati)
    const end = toDateTime(sinav.sinavTarihi, sinav.sinavBitisSaati)
    if (!overlaps(aday.start, aday.end, start, end)) continue

    const digerDerslikler = sinav.derslikler.map((d) => d.derslikId)
    const digerGozetmenler = sinav.derslikler.map((d) => d.gozetmenId).filter(hasGozetmen)
    const digerPersonel = dbapPersonel.get(sinav.dersBolumAkademikPersonelId)

    for (const id of aday.derslikIds) if (digerDerslikler.includes(id)) result.push({ tur: 'derslik', sinav, kaynakId: id })
    for (const id of aday.gozetmenIds)
      if (digerGozetmenler.includes(id) || id === digerPersonel) result.push({ tur: 'gozetmen', sinav, kaynakId: id })
    if (aday.personelId && (aday.personelId === digerPersonel || digerGozetmenler.includes(aday.personelId)))
      result.push({ tur: 'ogretimElemani', sinav, kaynakId: aday.personelId })
  }
  return result
}

/** Bölüme göre sabit renk (lacivert/mavi/turkuaz ağırlıklı, beyaz metinle okunur koyulukta) */
const BOLUM_RENKLERI = ['#003366', '#166fc7', '#0f7f86', '#5b3fa8', '#b45309', '#15803d', '#b91c1c', '#7a5c00', '#9d174d', '#334155']
export function bolumRengi(bolumId: number): string {
  return BOLUM_RENKLERI[Math.abs(bolumId) % BOLUM_RENKLERI.length]
}
