import { describe, expect, it } from 'vitest'
import { compareTr, matchesSearch, normalizeTr } from './search'
import { parseTemporaryCredentials } from './tempPassword'
import { DERS_KODU_PATTERN, normalizeDersKodu } from './dersKodu'

describe('Türkçe arama', () => {
  it('I/ı ve İ/i harflerini doğru eşler', () => {
    expect(normalizeTr('İNŞAAT  Mühendisliği')).toBe('inşaat mühendisliği')
    expect(matchesSearch('ışık', 'IŞIK Laboratuvarı')).toBe(true)
    expect(matchesSearch('isim', 'İSİM')).toBe(true)
    expect(matchesSearch('blm', 'Veri Yapıları', 'BLM201')).toBe(true)
    // Latin I içeren ders kodları Türkçe klavyeyle aranabilir
    expect(matchesSearch('ins', 'INS101')).toBe(true)
    expect(matchesSearch('İNS', 'INS101')).toBe(true)
    expect(matchesSearch('kimya', 'Fizik')).toBe(false)
    expect(matchesSearch('', 'herhangi')).toBe(true)
  })

  it('Türkçe alfabetik sıralar', () => {
    expect(['Çevre', 'Biyoloji', 'Cografya'].sort(compareTr)).toEqual(['Biyoloji', 'Cografya', 'Çevre'])
  })
})

describe('parseTemporaryCredentials', () => {
  it('backend mesajından kullanıcı adı ve parolayı ayrıştırır', () => {
    expect(
      parseTemporaryCredentials('Akademik Personel Eklendi. Kullanıcı adı: AY1234, geçici parola: Xk9mP2qRt7Lz'),
    ).toEqual({ userName: 'AY1234', password: 'Xk9mP2qRt7Lz' })
  })

  it('eşleşmeyen mesajda null döner', () => {
    expect(parseTemporaryCredentials('Akademik Personel Eklendi.')).toBeNull()
    expect(parseTemporaryCredentials(undefined)).toBeNull()
  })
})

describe('normalizeDersKodu', () => {
  it('boşlukları siler ve İngilizce büyük harfe çevirir (i → I, İ değil)', () => {
    expect(normalizeDersKodu('blm 101')).toBe('BLM101')
    expect(normalizeDersKodu('fiz101')).toBe('FIZ101')
    expect(DERS_KODU_PATTERN.test(normalizeDersKodu('fiz101'))).toBe(true)
  })
})
