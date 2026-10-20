import dayjs, { type Dayjs } from 'dayjs'
import { TekrarTipi, type Musaitlik } from '../../api/musaitlik'

export interface MusaitlikOccurrence {
  record: Musaitlik
  /** YYYY-MM-DD */
  date: string
  /** Tüm gün değilse "HH:mm:ss" */
  start?: string
  end?: string
  allDay: boolean
}

/** Haftalık kayıtta backend'in TekrarGunu'su yoksa başlangıç gününün haftanın günü kullanılır */
function weekday(record: Musaitlik): number {
  return record.tekrarGunu ?? dayjs(record.baslangicTarihi).day()
}

function monthDay(record: Musaitlik): number {
  return record.tekrarGunu ?? dayjs(record.baslangicTarihi).date()
}

/**
 * Kayıt verilen günde geçerli mi? Backend'deki EfAkademikPersonelMusaitlikDal.TarihGecerliMi ile aynı kural:
 * - Tekil: başlangıç–bitiş (bitiş yoksa sadece başlangıç günü) arasındaki her gün
 * - Haftalık: aralıktaki (bitiş yoksa süresiz), başlangıç günüyle aynı haftanın günü
 * - Aylık: aralıktaki, ayın aynı günü; ay kısaysa ayın son günü (31 → Şubat'ta 28/29)
 */
export function occursOn(record: Musaitlik, day: Dayjs): boolean {
  const d = day.startOf('day')
  const start = dayjs(record.baslangicTarihi).startOf('day')
  if (d.isBefore(start)) return false

  if (record.tekrarTipi === TekrarTipi.Tekil) {
    const end = dayjs(record.bitisTarihi ?? record.baslangicTarihi).startOf('day')
    return !d.isAfter(end)
  }

  if (record.bitisTarihi && d.isAfter(dayjs(record.bitisTarihi).startOf('day'))) return false

  if (record.tekrarTipi === TekrarTipi.Haftalik) return d.day() === weekday(record)

  if (record.tekrarTipi === TekrarTipi.Aylik) return d.date() === Math.min(monthDay(record), d.daysInMonth())

  return false
}

/** Kayıtları [from, to) aralığındaki günlere açar (takvimde gösterim için) */
export function expandMusaitlik(records: Musaitlik[], from: Dayjs, to: Dayjs): MusaitlikOccurrence[] {
  const result: MusaitlikOccurrence[] = []
  for (let day = from.startOf('day'); day.isBefore(to); day = day.add(1, 'day')) {
    for (const record of records) {
      if (!occursOn(record, day)) continue
      const allDay = !record.baslangicSaati || !record.bitisSaati
      result.push({
        record,
        date: day.format('YYYY-MM-DD'),
        start: allDay ? undefined : record.baslangicSaati!,
        end: allDay ? undefined : record.bitisSaati!,
        allDay,
      })
    }
  }
  return result
}

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

/** "Her Pazartesi", "Her ayın 15'i", "2 Kasım – 5 Kasım 2026" gibi okunur açıklama */
export function describeRecurrence(record: Musaitlik): string {
  const start = dayjs(record.baslangicTarihi)
  const end = record.bitisTarihi ? dayjs(record.bitisTarihi) : null
  const until = end ? ` (${end.format('D MMMM YYYY')} tarihine kadar)` : ''
  switch (record.tekrarTipi) {
    case TekrarTipi.Haftalik:
      return `Her ${GUNLER[weekday(record)]}${until}`
    case TekrarTipi.Aylik:
      return `Her ayın ${monthDay(record)}. günü${until}`
    default:
      return end && !end.isSame(start, 'day')
        ? `${start.format('D MMMM')} – ${end.format('D MMMM YYYY')}`
        : start.format('D MMMM YYYY dddd')
  }
}

export function describeHours(record: Pick<Musaitlik, 'baslangicSaati' | 'bitisSaati'>): string {
  if (!record.baslangicSaati || !record.bitisSaati) return 'Tüm gün'
  return `${record.baslangicSaati.slice(0, 5)} – ${record.bitisSaati.slice(0, 5)}`
}
