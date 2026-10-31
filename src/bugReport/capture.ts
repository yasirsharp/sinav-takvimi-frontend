import { toJpeg } from 'html-to-image'

/** IIS istek sınırı 2 MB; form alanlarıyla birlikte sığması için */
const MAX_BYTES = 1_200_000
const MAX_WIDTH = 1600

/** Ekran görüntüsüne girmeyecek öğeler: parola alanları, data-private işaretliler, hata bildirimi düğmesi */
export function isPrivateNode(node: Node): boolean {
  if (!(node instanceof HTMLElement)) return false
  if (node instanceof HTMLInputElement && node.type === 'password') return true
  return node.hasAttribute('data-private') || node.hasAttribute('data-bug-report-ignore')
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = /data:([^;]+)/.exec(header)?.[1] ?? 'image/jpeg'
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: mime })
}

/**
 * Görünen ekranın JPEG görüntüsü (sayfa DOM'undan çizilir; işletim sisteminin ekran görüntüsü değildir).
 * Alınamazsa null döner; bildirim görüntüsüz gönderilebilir.
 */
export interface Screenshot {
  blob: Blob
  /** Önizleme için (blob adresi gerektirmez, iptal edilmesi gerekmez) */
  dataUrl: string
}

export async function captureScreen(): Promise<Screenshot | null> {
  const width = window.innerWidth
  const height = window.innerHeight
  const baseRatio = Math.min(window.devicePixelRatio || 1, MAX_WIDTH / width)
  for (const [quality, ratio] of [
    [0.75, baseRatio],
    [0.6, baseRatio * 0.75],
    [0.5, baseRatio * 0.5],
  ]) {
    try {
      const dataUrl = await toJpeg(document.body, {
        quality,
        pixelRatio: ratio,
        width,
        height,
        backgroundColor: '#ffffff',
        filter: (node) => !isPrivateNode(node),
        style: {
          transform: `translate(${-window.scrollX}px, ${-window.scrollY}px)`,
          transformOrigin: 'top left',
        },
      })
      const blob = dataUrlToBlob(dataUrl)
      if (blob.size <= MAX_BYTES) return { blob, dataUrl }
    } catch {
      return null
    }
  }
  return null
}
