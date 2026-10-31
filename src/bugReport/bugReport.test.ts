import { describe, expect, it, vi } from 'vitest'
import type { AxiosError } from 'axios'
import { isBugReportShortcut } from './shortcut'
import { createShakeDetector } from './shake'
import { addLogEntry, clearLogEntries, describeApiError, getLogEntries } from './clientLog'
import { isPrivateNode } from './capture'

const key = (o: Partial<KeyboardEvent>) => ({ code: 'KeyH', altKey: false, shiftKey: false, ctrlKey: false, metaKey: false, repeat: false, ...o })

describe('kısayol', () => {
  it('yalnızca Alt+Shift+H', () => {
    expect(isBugReportShortcut(key({ altKey: true, shiftKey: true }))).toBe(true)
    expect(isBugReportShortcut(key({ altKey: true }))).toBe(false) // tarayıcının Yardım menüsü
    expect(isBugReportShortcut(key({ altKey: true, shiftKey: true, ctrlKey: true }))).toBe(false) // AltGr
    expect(isBugReportShortcut(key({ altKey: true, shiftKey: true, metaKey: true }))).toBe(false)
    expect(isBugReportShortcut(key({ altKey: true, shiftKey: true, repeat: true }))).toBe(false)
    expect(isBugReportShortcut(key({ code: 'KeyJ', altKey: true, shiftKey: true }))).toBe(false)
  })
})

describe('sallama', () => {
  const run = (samples: [number, number][]) => {
    const onShake = vi.fn()
    const detect = createShakeDetector(onShake)
    for (const [x, t] of samples) detect({ x, y: 0, z: 9.8 }, t)
    return onShake
  }

  it('kısa sürede birkaç sert sallama tetikler', () => {
    // her 150 ms'de yön değiştiren ±15 m/s² → fark 30
    expect(run([0, 1, 2, 3, 4, 5].map((i) => [i % 2 ? 15 : -15, i * 150]))).toHaveBeenCalledTimes(1)
  })

  it('yürüme veya tek sarsıntı tetiklemez', () => {
    expect(run([0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i % 2 ? 3 : -3, i * 150]))).not.toHaveBeenCalled()
    expect(
      run([
        [0, 0],
        [25, 100],
        [0, 200],
      ]),
    ).not.toHaveBeenCalled()
  })

  it('yavaş tekrarlanan sarsıntılar pencereye sığmaz', () => {
    expect(run([0, 1, 2, 3, 4, 5].map((i) => [i % 2 ? 15 : -15, i * 900]))).not.toHaveBeenCalled()
  })

  it('tetiklemeden sonra bir süre bekler', () => {
    const shake = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i): [number, number] => [i % 2 ? 15 : -15, i * 150])
    expect(run(shake)).toHaveBeenCalledTimes(1)
  })
})

describe('istemci günlüğü', () => {
  it('son 30 kaydı tutar', () => {
    clearLogEntries()
    for (let i = 0; i < 40; i++) addLogEntry('console', `hata ${i}`)
    const log = getLogEntries()
    expect(log).toHaveLength(30)
    expect(log[0].message).toBe('hata 10')
  })

  it('API hatasında sorgu parametreleri ve gövde yazılmaz', () => {
    const error = {
      config: { method: 'get', url: '/api/Ogrenci?search=Ali Veli', data: '{"password":"x"}' },
      response: { status: 400, data: { message: 'Geçersiz istek' } },
    } as unknown as AxiosError
    const text = describeApiError(error)
    expect(text).toBe('GET /api/Ogrenci → 400 · Geçersiz istek')
    expect(text).not.toContain('password')
  })
})

describe('ekran görüntüsü gizliliği', () => {
  it('parola alanları ve işaretli öğeler görüntüye girmez', () => {
    const pass = document.createElement('input')
    pass.type = 'password'
    const text = document.createElement('input')
    const priv = document.createElement('div')
    priv.setAttribute('data-private', '')
    expect(isPrivateNode(pass)).toBe(true)
    expect(isPrivateNode(priv)).toBe(true)
    expect(isPrivateNode(text)).toBe(false)
  })
})
