import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './errors'

function axiosError(status: number, data: unknown) {
  return new AxiosError('fail', 'ERR', undefined, undefined, {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  })
}

describe('getErrorMessage', () => {
  it('iş kuralı hatasında backend mesajını döner', () => {
    expect(getErrorMessage(axiosError(400, { success: false, message: 'E-posta/kullanıcı adı veya şifre hatalı.' })))
      .toBe('E-posta/kullanıcı adı veya şifre hatalı.')
  })

  it('doğrulama hatalarını birleştirir', () => {
    const data = {
      Message: 'Doğrulama hatası.',
      Errors: [
        { PropertyName: 'Password', ErrorMessage: 'Parola en az 8 karakter olmalıdır.' },
        { PropertyName: 'Email', ErrorMessage: 'Geçerli bir e-posta adresi giriniz.' },
      ],
    }
    expect(getErrorMessage(axiosError(400, data))).toBe(
      'Parola en az 8 karakter olmalıdır. Geçerli bir e-posta adresi giriniz.',
    )
  })

  it('güncel backend doğrulama biçimini (camelCase) okur', () => {
    const data = {
      success: false,
      message: 'Yeni parola mevcut paroladan farklı olmalıdır.',
      errors: [
        { propertyName: 'NewPassword', errorMessage: 'Yeni parola mevcut paroladan farklı olmalıdır.' },
        { propertyName: 'NewPassword', errorMessage: 'Parola en az bir rakam içermelidir.' },
      ],
    }
    expect(getErrorMessage(axiosError(400, data))).toBe(
      'Yeni parola mevcut paroladan farklı olmalıdır. Parola en az bir rakam içermelidir.',
    )
  })

  it('ASP.NET model doğrulama (ProblemDetails) mesajlarını okur', () => {
    const data = { title: 'One or more validation errors occurred.', errors: { Neden: ['Neden en fazla 100 karakter olabilir.'] } }
    expect(getErrorMessage(axiosError(400, data))).toBe('Neden en fazla 100 karakter olabilir.')
  })

  it('403 yanıtındaki backend mesajını gösterir', () => {
    expect(
      getErrorMessage(axiosError(403, { success: false, message: 'Devam etmeden önce parolanızı değiştirmeniz gerekiyor.' })),
    ).toMatch(/parolanızı değiştirmeniz/)
  })

  it('429, 403 ve 500 için anlaşılır mesaj döner', () => {
    expect(getErrorMessage(axiosError(429, ''))).toMatch(/1 dakika/)
    expect(getErrorMessage(axiosError(403, ''))).toMatch(/yetkiniz yok/)
    expect(getErrorMessage(axiosError(500, { Message: 'SQL detayı' }))).not.toMatch(/SQL/)
  })

  it('sunucuya ulaşılamazsa bağlantı mesajı döner', () => {
    expect(getErrorMessage(new AxiosError('Network Error'))).toMatch(/ulaşılamadı/)
  })
})
