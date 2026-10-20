import { describe, expect, it } from 'vitest'
import { normalizeHeader, parseBoolTr, rowsFromMatrix, splitList, toCsv, type ImportColumn } from './importUtils'

const columns: ImportColumn[] = [
  { key: 'ogrenciNo', header: 'Öğrenci No', required: true, example: '2026001' },
  { key: 'ad', header: 'Ad', required: true, example: 'Ali' },
  { key: 'eposta', header: 'E-posta', example: '', aliases: ['email'] },
]

describe('içe aktarma yardımcıları', () => {
  it('başlıkları Türkçe karakter, boşluk ve büyük harf gözetmeden eşler', () => {
    expect(normalizeHeader('ÖĞRENCİ  No')).toBe('ogrencino')
    const sheet = rowsFromMatrix(
      [
        ['ogrenci no', 'AD', 'Email', 'Fazladan'],
        [2026001, ' Ali ', null, 'x'],
        ['', '', '', ''],
        ['2026002', 'Ayşe', 'a@b.c', ''],
      ],
      columns,
    )
    expect(sheet.missingColumns).toEqual([])
    expect(sheet.rows).toEqual([
      { row: 2, values: { ogrenciNo: '2026001', ad: 'Ali', eposta: '' } },
      { row: 4, values: { ogrenciNo: '2026002', ad: 'Ayşe', eposta: 'a@b.c' } },
    ])
  })

  it('eksik zorunlu sütunları bildirir', () => {
    expect(rowsFromMatrix([['Ad']], columns).missingColumns.map((c) => c.key)).toEqual(['ogrenciNo'])
  })

  it('evet/hayır ve liste değerlerini çözer', () => {
    expect(parseBoolTr('Evet')).toBe(true)
    expect(parseBoolTr('HAYIR')).toBe(false)
    expect(parseBoolTr('')).toBe(false)
    expect(parseBoolTr('belki')).toBeNull()
    expect(splitList('Bilgisayar Müh., Elektrik;  İnşaat ')).toEqual(['Bilgisayar Müh.', 'Elektrik', 'İnşaat'])
  })

  it('Excel uyumlu CSV üretir', () => {
    expect(toCsv([['a', 'b;c'], ['"x"', null]])).toBe('﻿a;"b;c"\r\n"""x""";')
  })
})
