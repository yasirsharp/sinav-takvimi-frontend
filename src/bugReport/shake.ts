/**
 * Telefonu sallama algılayıcı: ardışık iki ölçüm arasındaki ivme farkı eşiği aşınca bir "sarsıntı" sayılır;
 * kısa sürede yeterli sarsıntı olursa tetiklenir. Yürürken veya telefonu masaya koyarken tetiklenmemesi için
 * eşik yüksek tutulur ve tetiklemeden sonra bir süre beklenir.
 */
export interface ShakeOptions {
  /** m/s², iki ölçüm arasındaki fark */
  threshold: number
  /** Gerekli sarsıntı sayısı */
  shakes: number
  /** Sarsıntıların sığması gereken süre (ms) */
  window: number
  /** İki sarsıntı arasındaki en kısa süre (aynı hareketi iki kez saymamak için) */
  minGap: number
  /** Tetiklemeden sonra bekleme (ms) */
  cooldown: number
}

export const DEFAULT_SHAKE: ShakeOptions = {
  threshold: 18,
  shakes: 4,
  window: 1200,
  minGap: 120,
  cooldown: 3000,
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

export function createShakeDetector(onShake: () => void, options: ShakeOptions = DEFAULT_SHAKE) {
  let last: Vec3 | null = null
  let peaks: number[] = []
  let blockedUntil = 0

  return (acc: Vec3, now: number) => {
    const prev = last
    last = acc
    if (!prev || now < blockedUntil) return
    const delta = Math.abs(acc.x - prev.x) + Math.abs(acc.y - prev.y) + Math.abs(acc.z - prev.z)
    if (delta < options.threshold) return
    if (peaks.length && now - peaks[peaks.length - 1] < options.minGap) return
    peaks = [...peaks.filter((t) => now - t <= options.window), now]
    if (peaks.length >= options.shakes) {
      peaks = []
      blockedUntil = now + options.cooldown
      onShake()
    }
  }
}

type MotionPermission = {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

/** iOS Safari hareket sensörü için kullanıcı dokunuşuyla izin ister; diğer tarayıcılarda izin gerekmez */
export function motionNeedsPermission(): boolean {
  return typeof window !== 'undefined' && typeof (window.DeviceMotionEvent as unknown as MotionPermission)?.requestPermission === 'function'
}

export async function requestMotionPermission(): Promise<boolean> {
  const api = window.DeviceMotionEvent as unknown as MotionPermission
  if (typeof api?.requestPermission !== 'function') return true
  try {
    return (await api.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

/** Dokunmatik ve hareket sensörlü cihaz mı (telefon/tablet) */
export function supportsShake(): boolean {
  return (
    typeof window !== 'undefined' &&
    'DeviceMotionEvent' in window &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  )
}

/** Sallama dinleyicisini bağlar; kaldırma fonksiyonu döner */
export function listenForShake(onShake: () => void): () => void {
  const detect = createShakeDetector(onShake)
  const handler = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity ?? e.acceleration
    if (a?.x == null || a.y == null || a.z == null) return
    detect({ x: a.x, y: a.y, z: a.z }, e.timeStamp || performance.now())
  }
  window.addEventListener('devicemotion', handler)
  return () => window.removeEventListener('devicemotion', handler)
}
