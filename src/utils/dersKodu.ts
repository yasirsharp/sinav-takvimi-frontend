/** Backend kuralı: sadece büyük harf ve rakam (ör. BLM101) */
export const DERS_KODU_PATTERN = /^[A-Z0-9]+$/

/** "blm 101" → "BLM101". Türkçe i→İ dönüşümü kodu geçersiz kılacağı için İngilizce büyük harf kullanılır. */
export function normalizeDersKodu(value: string): string {
  return value.replace(/\s+/g, '').toLocaleUpperCase('en-US')
}
