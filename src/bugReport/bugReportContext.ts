import { createContext, useContext } from 'react'

export interface BugReportContextValue {
  /** Ekran görüntüsünü alıp hata bildirimi penceresini açar */
  open: () => void
  /** Telefonu sallayınca açılsın mı (yalnızca dokunmatik cihazlarda anlamlı) */
  shakeEnabled: boolean
  setShakeEnabled: (enabled: boolean) => Promise<boolean>
  shakeSupported: boolean
}

export const BugReportContext = createContext<BugReportContextValue | null>(null)

export function useBugReport(): BugReportContextValue | null {
  return useContext(BugReportContext)
}
