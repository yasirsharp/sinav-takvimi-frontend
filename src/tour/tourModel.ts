import { hasAnyRole } from '../auth/roles'
import { matchesSearch } from '../utils/search'

export interface TourStepDef {
  /** Vurgulanacak öğenin data-tour değeri. Verilmezse adım ekranın ortasında gösterilir. */
  target?: string
  /** data-tour yerine CSS seçicisi (ör. takvimin araç çubuğu) */
  selector?: string
  title: string
  description: string
  bullets?: string[]
  /** Boşsa herkes görür */
  roles?: readonly string[]
}

export interface TourDef {
  id: string
  /** Turun ait olduğu sayfa; yardım merkezindeki "turu başlat" bu sayfaya gider */
  path: string
  title: string
  summary: string
  keywords: string[]
  roles?: readonly string[]
  steps: TourStepDef[]
  /** Bu tur bitince görülmüş sayılacak diğer turlar (aynı adımları içerenler) */
  alsoMarks?: string[]
}

export interface FaqItem {
  question: string
  answer: string
  keywords?: string[]
  roles?: readonly string[]
}

export function stepsForRoles(tour: TourDef, roles: readonly string[]): TourStepDef[] {
  return tour.steps.filter((s) => hasAnyRole(roles, s.roles))
}

export function toursForRoles(tours: TourDef[], roles: readonly string[]): TourDef[] {
  return tours.filter((t) => hasAnyRole(roles, t.roles) && stepsForRoles(t, roles).length > 0)
}

/**
 * Başlık, özet, anahtar kelimeler ve adım metinlerinde Türkçe büyük/küçük harf duyarsız arama.
 * Başlığı, özeti veya anahtar kelimesi eşleşen konular, yalnızca adım metni eşleşenlerden önce gelir.
 */
export function searchTours(tours: TourDef[], term: string, roles: readonly string[]): TourDef[] {
  const primary = (t: TourDef) => matchesSearch(term, t.title, t.summary, t.keywords.join(' '))
  const found = tours.filter(
    (t) => primary(t) || matchesSearch(term, ...stepsForRoles(t, roles).flatMap((s) => [s.title, s.description, ...(s.bullets ?? [])])),
  )
  return [...found.filter(primary), ...found.filter((t) => !primary(t))]
}

export function searchFaq(items: FaqItem[], term: string, roles: readonly string[]): FaqItem[] {
  return items.filter((f) => hasAnyRole(roles, f.roles) && matchesSearch(term, f.question, f.answer, (f.keywords ?? []).join(' ')))
}

export function tourForPath(tours: TourDef[], path: string): TourDef | undefined {
  return tours.find((t) => t.path === path && t.id !== GENEL_TOUR_ID)
}

export const GENEL_TOUR_ID = 'genel'

// --- "Görüldü" bilgisi: tarayıcıda, kullanıcıya göre ---

const PREFIX = 'sinav-takvimi.tour.'
/** Bu anahtar '1' ise turlar kendiliğinden açılmaz (uçtan uca testler kullanır). "?" ile yine açılır. */
export const AUTO_TOUR_DISABLED_KEY = `${PREFIX}disabled`

const seenKey = (userId: number, tourId: string) => `${PREFIX}${userId}.${tourId}`

export function isSeen(userId: number, tourId: string): boolean {
  try {
    return localStorage.getItem(seenKey(userId, tourId)) === '1'
  } catch {
    // Depolama kapalıysa tur her girişte açılmasın
    return true
  }
}

export function markSeen(userId: number, tourId: string) {
  try {
    localStorage.setItem(seenKey(userId, tourId), '1')
  } catch {
    // depolama kapalı
  }
}

/** Kullanıcının tüm turlarını tekrar "görülmedi" yapar */
export function resetSeen(userId: number) {
  try {
    const prefix = `${PREFIX}${userId}.`
    Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // depolama kapalı
  }
}

export function autoTourDisabled(): boolean {
  try {
    return localStorage.getItem(AUTO_TOUR_DISABLED_KEY) === '1'
  } catch {
    return true
  }
}
