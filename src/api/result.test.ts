import { describe, expect, it } from 'vitest'
import { ApiResultError, unwrap, unwrapData } from './result'
import { getErrorMessage } from './errors'

describe('unwrap', () => {
  it('başarılı yanıtta veriyi döner', async () => {
    await expect(unwrapData(Promise.resolve({ data: { success: true, data: [1, 2] } }))).resolves.toEqual([1, 2])
  })

  it('success=false yanıtta backend mesajıyla hata fırlatır', async () => {
    const promise = unwrap(Promise.resolve({ data: { success: false, message: 'Bölüm bulunamadı.', data: null } }))
    await expect(promise).rejects.toBeInstanceOf(ApiResultError)
    await promise.catch((error) => expect(getErrorMessage(error)).toBe('Bölüm bulunamadı.'))
  })
})
