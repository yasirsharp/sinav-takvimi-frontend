import { normalizeTr } from '../../utils/search'

export interface ImportColumn {
  key: string
  /** Şablondaki sütun başlığı */
  header: string
  required?: boolean
  /** Şablondaki örnek değer */
  example: string
  /** Başlığın kabul edilen diğer yazımları */
  aliases?: string[]
  help?: string
}

export interface ParsedRow {
  /** Dosyadaki satır numarası (başlık 1. satır) */
  row: number
  values: Record<string, string>
}

export interface ParsedSheet {
  rows: ParsedRow[]
  missingColumns: ImportColumn[]
}

/** "Öğrenci No" → "ogrencino": başlıklar büyük/küçük harf, boşluk ve Türkçe karakter farkı gözetmeden eşleşir */
export function normalizeHeader(value: string): string {
  return normalizeTr(value)
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]/g, '')
}

const cellText = (cell: unknown): string => {
  if (cell == null) return ''
  if (cell instanceof Date) return cell.toISOString().slice(0, 10)
  return String(cell).trim()
}

/**
 * İlk satırı başlık kabul ederek tabloyu satırlara çevirir. Tamamen boş satırlar atlanır.
 * Tanımsız sütunlar yok sayılır; zorunlu sütun başlığı yoksa missingColumns'ta döner.
 */
export function rowsFromMatrix(matrix: unknown[][], columns: ImportColumn[]): ParsedSheet {
  const [headerRow = [], ...dataRows] = matrix
  const headers = headerRow.map((h) => normalizeHeader(cellText(h)))
  const indexByKey = new Map<string, number>()
  for (const column of columns) {
    const names = [column.header, column.key, ...(column.aliases ?? [])].map(normalizeHeader)
    const index = headers.findIndex((h) => names.includes(h))
    if (index >= 0) indexByKey.set(column.key, index)
  }

  const rows: ParsedRow[] = []
  dataRows.forEach((cells, i) => {
    const values: Record<string, string> = {}
    for (const column of columns) {
      const index = indexByKey.get(column.key)
      values[column.key] = index == null ? '' : cellText(cells[index])
    }
    if (Object.values(values).some((v) => v !== '')) rows.push({ row: i + 2, values })
  })

  return { rows, missingColumns: columns.filter((c) => c.required && !indexByKey.has(c.key)) }
}

/** "evet", "e", "x", "1", "true" → true; "hayır", "h", "0", "false", "" → false; diğerleri null */
export function parseBoolTr(value: string): boolean | null {
  const v = normalizeHeader(value)
  if (['evet', 'e', 'x', '1', 'true', 'var', 'ortak'].includes(v)) return true
  if (['', 'hayir', 'h', '0', 'false', 'yok'].includes(v)) return false
  return null
}

/** "Bilgisayar Müh., Elektrik" → ["Bilgisayar Müh.", "Elektrik"] (virgül, noktalı virgül veya satır sonu) */
export function splitList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Excel'in Türkçe ayarlarıyla açılabilen CSV: noktalı virgül ayraçlı, UTF-8 BOM'lu */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const escape = (value: string | number | null | undefined) => {
    const s = value == null ? '' : String(value)
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + rows.map((r) => r.map(escape).join(';')).join('\r\n')
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** CSV veya XLSX dosyasını tabloya çevirir. Kütüphaneler sadece içe aktarma açıldığında indirilir. */
export async function readSpreadsheet(file: File): Promise<unknown[][]> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser')
    return (await readSheet(file)) as unknown[][]
  }
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    const Papa = (await import('papaparse')).default
    const text = await file.text()
    const result = Papa.parse<string[]>(text.replace(/^﻿/, ''), { skipEmptyLines: 'greedy' })
    return result.data
  }
  throw new Error('Sadece .xlsx veya .csv dosyası yükleyebilirsiniz. Eski .xls dosyasını Excel\'de "Farklı kaydet → .xlsx" ile dönüştürün.')
}

export async function downloadTemplate(columns: ImportColumn[], baseName: string, format: 'xlsx' | 'csv') {
  if (format === 'csv') {
    downloadBlob(
      new Blob([toCsv([columns.map((c) => c.header), columns.map((c) => c.example)])], { type: 'text/csv;charset=utf-8' }),
      `${baseName}.csv`,
    )
    return
  }
  const writeXlsxFile = (await import('write-excel-file/browser')).default
  const header = columns.map((c) => ({ value: c.header, fontWeight: 'bold' as const, backgroundColor: '#dbe7f3' }))
  const example = columns.map((c) => ({ value: c.example, type: String }))
  const blob = await writeXlsxFile([header, example], {
    sheet: 'Veri',
    columns: columns.map((c) => ({ width: Math.max(14, c.header.length + 4, c.example.length + 2) })),
  }).toBlob()
  downloadBlob(blob, `${baseName}.xlsx`)
}
