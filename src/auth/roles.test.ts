import { describe, expect, it } from 'vitest'
import { Personel, Planlayici, Roles, Yonetici, hasAnyRole } from './roles'

describe('hasAnyRole', () => {
  it('izin listesi boşsa herkese izin verir', () => {
    expect(hasAnyRole([], undefined)).toBe(true)
    expect(hasAnyRole([], [])).toBe(true)
  })

  it('rol gruplarını backend ile aynı şekilde uygular', () => {
    expect(hasAnyRole([Roles.Admin], Yonetici)).toBe(true)
    expect(hasAnyRole([Roles.BolumGorevlisi], Yonetici)).toBe(false)
    expect(hasAnyRole([Roles.BolumGorevlisi], Planlayici)).toBe(true)
    expect(hasAnyRole([Roles.AkademikPersonel], Personel)).toBe(true)
    expect(hasAnyRole([Roles.Ogrenci], Personel)).toBe(false)
  })
})
