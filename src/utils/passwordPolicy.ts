/** Backend'deki parola kuralı (Business/ValidationRules/FluentValidation/AuthValidators.cs) ile aynı */
export interface PasswordRule {
  label: string
  ok: boolean
}

export const PASSWORD_MIN_LENGTH = 8

export function checkPassword(password: string): PasswordRule[] {
  return [
    { label: `En az ${PASSWORD_MIN_LENGTH} karakter`, ok: password.length >= PASSWORD_MIN_LENGTH },
    { label: 'Bir büyük harf', ok: /[A-ZÇĞİÖŞÜ]/.test(password) },
    { label: 'Bir küçük harf', ok: /[a-zçğıöşü]/.test(password) },
    { label: 'Bir rakam', ok: /[0-9]/.test(password) },
  ]
}

export function isStrongPassword(password: string): boolean {
  return password.length <= 128 && checkPassword(password).every((r) => r.ok)
}
