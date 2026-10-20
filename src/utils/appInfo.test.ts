import { describe, expect, it } from 'vitest'
import { buildFeedbackMailto } from './appInfo'

describe('sorun bildirimi', () => {
  it('sayfa, roller ve tarayıcı bilgisiyle mailto üretir', () => {
    const href = buildFeedbackMailto('test@duzce.edu.tr', {
      url: 'https://sinav.duzce.edu.tr/sinav-takvimi',
      userAgent: 'Chrome',
      roles: ['akademik.personel'],
      userName: 'ali@duzce.edu.tr',
    })
    expect(href.startsWith('mailto:test@duzce.edu.tr?subject=')).toBe(true)
    const body = decodeURIComponent(href.split('body=')[1])
    expect(body).toContain('Sayfa: https://sinav.duzce.edu.tr/sinav-takvimi')
    expect(body).toContain('Roller: akademik.personel')
    expect(body).toContain('Tarayıcı: Chrome')
  })
})
