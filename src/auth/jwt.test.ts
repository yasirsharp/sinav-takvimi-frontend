import { describe, expect, it } from 'vitest'
import { isExpired, parseToken } from './jwt'
import { CLAIMS, futureExp, makeToken } from '../test/tokens'

describe('parseToken', () => {
  it('tek rolü ve öğrenci claimlerini okur', () => {
    const token = makeToken({
      [CLAIMS.id]: '5',
      [CLAIMS.name]: 'Ayşe Yılmaz',
      email: 'ayse@ogr.duzce.edu.tr',
      [CLAIMS.role]: 'ogrenci',
      BolumId: '3',
      OgrenciNo: '2024001',
      exp: futureExp(),
    })

    const user = parseToken(token)

    expect(user).toMatchObject({
      id: 5,
      name: 'Ayşe Yılmaz',
      email: 'ayse@ogr.duzce.edu.tr',
      roles: ['ogrenci'],
      bolumIds: [3],
      ogrenciNo: '2024001',
    })
  })

  it('birden çok rolü ve bölüm görevlisinin numaralı bölüm claimlerini okur', () => {
    const token = makeToken({
      [CLAIMS.id]: '9',
      [CLAIMS.role]: ['bolum.gorevlisi', 'akademik.personel'],
      '1.BolumId': '4',
      '2.BolumId': '7',
      exp: futureExp(),
    })

    const user = parseToken(token)

    expect(user?.roles).toEqual(['bolum.gorevlisi', 'akademik.personel'])
    expect(user?.bolumIds).toEqual([4, 7])
  })

  it('rol claimi yoksa boş liste döner', () => {
    const user = parseToken(makeToken({ [CLAIMS.id]: '1', exp: futureExp() }))
    expect(user?.roles).toEqual([])
  })

  it('bozuk veya eksik tokenda null döner', () => {
    expect(parseToken('gecersiz')).toBeNull()
    expect(parseToken(makeToken({ exp: futureExp() }))).toBeNull()
    expect(parseToken(makeToken({ [CLAIMS.id]: '1' }))).toBeNull()
  })

  it('süresi dolmuş tokenı tespit eder', () => {
    const user = parseToken(makeToken({ [CLAIMS.id]: '1', exp: futureExp(-1) }))!
    expect(isExpired(user)).toBe(true)
  })
})
