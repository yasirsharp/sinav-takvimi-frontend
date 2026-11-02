import { useCallback } from 'react'
import { App, Typography } from 'antd'
import { getErrorMessage } from '../api/errors'
import { useBugReport } from './bugReportContext'

/**
 * Hata mesajını gösterir ve yanına "Bu bir hata mı? Bildir" bağlantısı koyar: tıklanınca hata bildirimi penceresi
 * ekrandaki mesajla önceden doldurulmuş açılır. Çakışma gibi iş kuralı mesajları çoğu zaman doğrudur; kullanıcı
 * yanlış olduğunu düşünürse tek tıkla bildirebilir.
 */
export function useErrorToast() {
  const { message } = App.useApp()
  const bugReport = useBugReport()

  return useCallback(
    (error: unknown, duration?: number) => {
      const text = getErrorMessage(error)
      message.error({
        duration: duration ?? (bugReport ? 8 : 3),
        content: (
          <span>
            {text}
            {bugReport && (
              <>
                {' '}
                <Typography.Link
                  data-bug-report-ignore=""
                  // Mesaj ekranda kalır: ekran görüntüsüne de girer
                  onClick={() => bugReport.open({ description: `Ekranda şu hata çıktı: "${text}"\n\nNe yapıyordum: ` })}
                >
                  Bu bir hata mı? Bildir
                </Typography.Link>
              </>
            )}
          </span>
        ),
      })
    },
    [message, bugReport],
  )
}
