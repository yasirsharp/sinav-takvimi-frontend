import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api/client'
import { tokenStorage } from '../auth/tokenStorage'
import { isNoise, reportClientError, resetAutoReportState, shouldSend } from './autoReport'

describe('kendiliğinden hata kaydı', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetAutoReportState()
  })

  it('bilinen gürültüyü atlar', () => {
    expect(isNoise('ResizeObserver loop completed with undelivered notifications.')).toBe(true)
    expect(isNoise('Script error.')).toBe(true)
    expect(isNoise('TypeError: x', 'at chrome-extension://abc/content.js:1')).toBe(true)
    expect(isNoise('Failed to fetch dynamically imported module: /assets/a.js')).toBe(true)
    expect(isNoise("TypeError: Cannot read properties of undefined (reading 'ad')")).toBe(false)
  })

  it('aynı hata bir kez, oturumda en fazla 10 kayıt', () => {
    expect(shouldSend('a')).toBe(true)
    expect(shouldSend('a')).toBe(false)
    for (let i = 0; i < 9; i++) expect(shouldSend(`b${i}`)).toBe(true)
    expect(shouldSend('yeni')).toBe(false)
  })

  it('giriş yapılmışsa sayfa hatasını gönderir; API hatalarını ve oturumsuz durumu göndermez', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { success: true, data: 1 } })
    vi.spyOn(tokenStorage, 'get').mockReturnValue(null)
    reportClientError('error', new TypeError('oturum yok'))
    expect(post).not.toHaveBeenCalled()

    vi.spyOn(tokenStorage, 'get').mockReturnValue('token')
    reportClientError('promise', new AxiosError('Request failed', '400'))
    expect(post).not.toHaveBeenCalled()

    reportClientError('crash', new TypeError("Cannot read properties of undefined (reading 'ad')"), '\n    at SinavFormModal')
    expect(post).toHaveBeenCalledTimes(1)
    const [url, body] = post.mock.calls[0] as [string, { kind: string; message: string; stack: string; pageUrl: string }]
    expect(url).toBe('/api/BugReport/auto')
    expect(body.kind).toBe('crash')
    expect(body.message).toContain("reading 'ad'")
    expect(body.stack).toContain('SinavFormModal')
    expect(body.pageUrl).not.toContain('?')

    reportClientError('error', new TypeError("Cannot read properties of undefined (reading 'ad')"))
    expect(post).toHaveBeenCalledTimes(1) // aynı hata tekrar gönderilmez
  })
})
