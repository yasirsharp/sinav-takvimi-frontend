import { createContext, useContext } from 'react'
import type { TourDef } from './tourModel'

export interface TourContextValue {
  /** Turu verilen kimlikle başlatır (adımlar kullanıcının rolüne göre süzülür) */
  start: (tourId: string) => void
  /** Bulunulan sayfanın turu */
  pageTour?: TourDef
  /** Kullanıcının rolüne uygun tüm turlar (yardım merkezi) */
  tours: TourDef[]
  /** Tüm turları "görülmedi" yapar; sayfalar ilk ziyaretteki gibi turu tekrar kendiliğinden açar */
  resetAll: () => void
}

export const TourContext = createContext<TourContextValue | null>(null)

/** Tur bağlamı. TourProvider dışında (ör. birim testlerinde) null döner. */
export function useTour(): TourContextValue | null {
  return useContext(TourContext)
}
