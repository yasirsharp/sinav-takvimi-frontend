/**
 * Arama için metni normalleştirir: Türkçe küçük harfe çevirir, ardından ı/i farkını kaldırır.
 * Böylece "inş" aramasında "İnşaat", "ins" aramasında Latin harfli "INS101" kodu da bulunur
 * (Türkçe kurala göre I → ı olduğundan aksi halde ders kodları eşleşmez).
 */
export function normalizeTr(value: string | null | undefined): string {
  return (value ?? '').toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/\s+/g, ' ').trim()
}

/** Aranan metin verilen alanlardan herhangi birinde geçiyor mu? (Türkçe büyük/küçük harf duyarsız) */
export function matchesSearch(term: string, ...fields: (string | number | null | undefined)[]): boolean {
  const needle = normalizeTr(term)
  if (!needle) return true
  return fields.some((field) => normalizeTr(field == null ? '' : String(field)).includes(needle))
}

/** Tablo sıralaması için Türkçe alfabetik karşılaştırma */
export function compareTr(a: string | null | undefined, b: string | null | undefined): number {
  return (a ?? '').localeCompare(b ?? '', 'tr', { sensitivity: 'base' })
}
