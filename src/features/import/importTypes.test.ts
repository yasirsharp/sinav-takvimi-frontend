import { describe, expect, it } from 'vitest'
import { validateRows, type ImportDefinition } from './importTypes'
import { stripUnvan } from './definitions'

const definition: ImportDefinition<{ no: string }> = {
  title: 'Test',
  fileName: 'test',
  columns: [{ key: 'no', header: 'No', required: true, example: '1' }],
  parseRow: (v) => ({ value: { no: v.no }, errors: v.no ? [] : ['No boş.'] }),
  uniqueKey: (v) => v.no,
  run: async () => [],
}

describe('içe aktarma doğrulaması', () => {
  it('hatalı ve dosyada tekrar eden satırları işaretler', () => {
    const rows = validateRows(definition, [
      { row: 2, values: { no: '1' } },
      { row: 3, values: { no: '' } },
      { row: 4, values: { no: '1' } },
    ])
    expect(rows.map((r) => r.value !== undefined)).toEqual([true, false, false])
    expect(rows[2].errors[0]).toMatch(/2\. satır/)
  })

  it('öğretim elemanı adındaki unvanı yok sayar', () => {
    expect(stripUnvan('Prof. Dr. Zeynep Çelik')).toBe('zeynep çelik')
    expect(stripUnvan('Dr. Öğr. Üyesi Mehmet Öz')).toBe('mehmet öz')
    expect(stripUnvan('Öğr. Gör. Ali Can Yıldız')).toBe('ali can yildiz')
  })
})
