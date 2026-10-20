import type { ReactNode } from 'react'
import type { ImportColumn, ParsedRow } from './importUtils'

export interface ImportResult {
  /** Dosyadaki satır numarası */
  row: number
  success: boolean
  message: string
  userName?: string
  password?: string
}

export interface ValidatedRow<T> extends ParsedRow {
  value?: T
  errors: string[]
}

export interface ImportDefinition<T> {
  /** ör. "Öğrenci" */
  title: string
  /** Şablon ve sonuç dosyası adı, ör. "ogrenci" */
  fileName: string
  columns: ImportColumn[]
  /** Şablonun üstünde gösterilecek açıklamalar */
  notes?: ReactNode
  /** Satırı doğrular ve backend'e gidecek değere çevirir */
  parseRow: (values: Record<string, string>) => { value?: T; errors: string[] }
  /** Dosya içinde aynı kaydın iki kez geçmesini yakalamak için anahtar (ör. öğrenci no) */
  uniqueKey?: (value: T) => string
  /** Geçerli satırları kaydeder; ilerleme 0..1 */
  run: (rows: { row: number; value: T }[], onProgress: (ratio: number) => void) => Promise<ImportResult[]>
  /** Sonuçta kullanıcı adı ve geçici parola var mı? */
  credentials?: boolean
  /** Veriler hazır değilse (ör. bölüm listesi yükleniyor) false */
  ready?: boolean
}

/** Satırları doğrular ve dosya içi tekrarları işaretler */
export function validateRows<T>(definition: ImportDefinition<T>, rows: ParsedRow[]): ValidatedRow<T>[] {
  const seen = new Map<string, number>()
  return rows.map((r) => {
    const { value, errors } = definition.parseRow(r.values)
    const all = [...errors]
    if (value && definition.uniqueKey) {
      const key = definition.uniqueKey(value)
      const first = seen.get(key)
      if (first != null) all.push(`Dosyada tekrar ediyor (${first}. satır ile aynı).`)
      else seen.set(key, r.row)
    }
    return { ...r, value: all.length ? undefined : value, errors: all }
  })
}
