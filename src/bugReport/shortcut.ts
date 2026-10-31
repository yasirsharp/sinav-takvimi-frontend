/** Hata bildirimi kısayolu: Alt+Shift+H (Mac'te Option+Shift+H). Ctrl/Cmd basılıyken tetiklenmez. */
export const BUG_SHORTCUT_LABEL = 'Alt + Shift + H'

export function isBugReportShortcut(e: Pick<KeyboardEvent, 'code' | 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'repeat'>) {
  // event.code klavye düzeninden bağımsızdır (Mac'te Option+Shift+H "Ó" yazsa da KeyH gelir)
  return e.code === 'KeyH' && e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.repeat
}
