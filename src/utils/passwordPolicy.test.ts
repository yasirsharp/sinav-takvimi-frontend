import { describe, expect, it } from 'vitest'
import { checkPassword, isStrongPassword } from './passwordPolicy'

describe('parola kuralı', () => {
  it('backend kuralıyla aynı: 8+ karakter, büyük, küçük harf ve rakam', () => {
    expect(isStrongPassword('Parola12')).toBe(true)
    expect(isStrongPassword('Şifreğ12')).toBe(true)
    expect(isStrongPassword('parola12')).toBe(false)
    expect(isStrongPassword('PAROLA12')).toBe(false)
    expect(isStrongPassword('Parolasiz')).toBe(false)
    expect(isStrongPassword('Pa1')).toBe(false)
  })

  it('her kuralın durumunu ayrı döner', () => {
    expect(checkPassword('abc').map((r) => r.ok)).toEqual([false, false, true, false])
  })
})
