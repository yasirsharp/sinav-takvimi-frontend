import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import { describe, expect, it } from 'vitest'
import { TekrarTipi, type Musaitlik } from '../../api/musaitlik'
import { describeHours, describeRecurrence, expandMusaitlik, occursOn } from './musaitlikUtils'

dayjs.locale('tr')

const base: Musaitlik = {
  id: 1,
  akademikPersonelId: 1,
  baslangicTarihi: '2026-11-02T00:00:00', // Pazartesi
  bitisTarihi: null,
  baslangicSaati: '09:00:00',
  bitisSaati: '12:00:00',
  tekrarTipi: TekrarTipi.Tekil,
  isMusait: false,
}

describe('müsaitlik tekrarları (backend TarihGecerliMi ile aynı)', () => {
  it('tekil: bitiş yoksa sadece başlangıç günü, varsa aralık', () => {
    expect(occursOn(base, dayjs('2026-11-02'))).toBe(true)
    expect(occursOn(base, dayjs('2026-11-03'))).toBe(false)
    const aralik = { ...base, bitisTarihi: '2026-11-04T00:00:00' }
    expect(occursOn(aralik, dayjs('2026-11-04'))).toBe(true)
    expect(occursOn(aralik, dayjs('2026-11-05'))).toBe(false)
  })

  it('haftalık: aynı haftanın günü, başlangıçtan önce ve bitişten sonra değil', () => {
    const haftalik = { ...base, tekrarTipi: TekrarTipi.Haftalik, tekrarGunu: 1, bitisTarihi: '2026-11-30T00:00:00' }
    expect(occursOn(haftalik, dayjs('2026-11-09'))).toBe(true)
    expect(occursOn(haftalik, dayjs('2026-11-10'))).toBe(false)
    expect(occursOn(haftalik, dayjs('2026-10-26'))).toBe(false)
    expect(occursOn(haftalik, dayjs('2026-12-07'))).toBe(false)
  })

  it('aylık: ay kısaysa ayın son günü', () => {
    const aylik = { ...base, baslangicTarihi: '2026-01-31T00:00:00', tekrarTipi: TekrarTipi.Aylik, tekrarGunu: 31 }
    expect(occursOn(aylik, dayjs('2026-02-28'))).toBe(true)
    expect(occursOn(aylik, dayjs('2026-03-31'))).toBe(true)
    expect(occursOn(aylik, dayjs('2026-04-30'))).toBe(true)
    expect(occursOn(aylik, dayjs('2026-04-29'))).toBe(false)
  })

  it('aralığa açar; saat yoksa tüm gün', () => {
    const haftalik = { ...base, tekrarTipi: TekrarTipi.Haftalik, baslangicSaati: null, bitisSaati: null }
    const list = expandMusaitlik([haftalik], dayjs('2026-11-01'), dayjs('2026-12-01'))
    expect(list.map((o) => o.date)).toEqual(['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30'])
    expect(list.every((o) => o.allDay)).toBe(true)
  })

  it('okunur açıklama', () => {
    expect(describeRecurrence({ ...base, tekrarTipi: TekrarTipi.Haftalik })).toBe('Her Pazartesi')
    expect(describeRecurrence({ ...base, tekrarTipi: TekrarTipi.Aylik, tekrarGunu: 15 })).toBe('Her ayın 15. günü')
    expect(describeHours(base)).toBe('09:00 – 12:00')
    expect(describeHours({ baslangicSaati: null, bitisSaati: null })).toBe('Tüm gün')
  })
})
