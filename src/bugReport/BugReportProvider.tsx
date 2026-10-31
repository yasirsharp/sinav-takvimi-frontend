import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { App, Button, Tooltip } from 'antd'
import { BugOutlined } from '@ant-design/icons'
import { brand } from '../theme'
import { useAuth } from '../auth/useAuth'
import { BugReportContext, type BugReportContextValue } from './bugReportContext'
import BugReportModal from './BugReportModal'
import { captureScreen, type Screenshot } from './capture'
import { listenForShake, motionNeedsPermission, requestMotionPermission, supportsShake } from './shake'
import { BUG_SHORTCUT_LABEL, isBugReportShortcut } from './shortcut'

const SHAKE_KEY = 'sinav-takvimi.shake'

function readShakePref(): boolean {
  try {
    const value = localStorage.getItem(SHAKE_KEY)
    // iPhone'da izin dokunuşla alınmalı; kullanıcı açana kadar kapalı
    return value == null ? !motionNeedsPermission() : value === 'on'
  } catch {
    return false
  }
}

/** Kısayol, telefonu sallama ve köşedeki düğme ile hata bildirimi penceresini açar (giriş yapılmış sayfalarda) */
export default function BugReportProvider({ children }: { children: ReactNode }) {
  const { message } = App.useApp()
  const { user } = useAuth()
  // Geçici parolalı kullanıcı parolasını değiştirene kadar API'ye bildirim gönderemez
  const active = !!user && !user.mustChangePassword
  const [open, setOpen] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [screenshot, setScreenshot] = useState<Screenshot | null>(null)
  const [shakeEnabled, setShakeState] = useState(readShakePref)
  const busy = useRef(false)
  const [shakeSupported] = useState(supportsShake)
  // Her açılışta pencere sıfırdan kurulur (açıklama, günlük, gönderim durumu)
  const [openCount, setOpenCount] = useState(0)

  const openReport = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setCapturing(true)
    // Görüntü pencere açılmadan alınır; kullanıcı gördüğü ekranı gönderir
    const shot = await captureScreen()
    setScreenshot(shot)
    setCapturing(false)
    setOpenCount((n) => n + 1)
    setOpen(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    busy.current = false
  }, [])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (!isBugReportShortcut(e)) return
      e.preventDefault()
      void openReport()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openReport, active])

  useEffect(() => {
    if (!active || !shakeSupported || !shakeEnabled) return
    let stop = () => {}
    if (motionNeedsPermission()) {
      // iOS: izin her sayfa yüklemesinde bir dokunuşla yenilenmeli; ilk dokunuşta sessizce istenir
      const onTouch = () => {
        void requestMotionPermission().then((ok) => {
          if (ok) stop = listenForShake(() => void openReport())
        })
      }
      window.addEventListener('touchend', onTouch, { once: true })
      return () => {
        window.removeEventListener('touchend', onTouch)
        stop()
      }
    }
    stop = listenForShake(() => void openReport())
    return () => stop()
  }, [active, shakeSupported, shakeEnabled, openReport])

  const setShakeEnabled = useCallback(
    async (enabled: boolean) => {
      if (enabled && !(await requestMotionPermission())) {
        message.warning('Hareket sensörü izni verilmedi. Tarayıcı ayarlarından izin verebilirsiniz.')
        return false
      }
      try {
        localStorage.setItem(SHAKE_KEY, enabled ? 'on' : 'off')
      } catch {
        // depolama kapalı
      }
      setShakeState(enabled)
      if (enabled) message.success('Telefonu birkaç kez hızlıca salladığınızda hata bildirimi açılacak.')
      return true
    },
    [message],
  )

  const value = useMemo<BugReportContextValue | null>(
    () =>
      active
        ? {
            open: () => void openReport(),
            shakeEnabled,
            setShakeEnabled,
            shakeSupported,
          }
        : null,
    [active, openReport, shakeEnabled, setShakeEnabled, shakeSupported],
  )

  return (
    <BugReportContext.Provider value={value}>
      {children}
      {active && (
        <Tooltip title={`Hata bildir (${BUG_SHORTCUT_LABEL})`} placement="left">
          <Button
            shape="circle"
            size="large"
            icon={<BugOutlined />}
            aria-label="Hata bildir"
            data-tour="bug-report"
            data-bug-report-ignore=""
            loading={capturing}
            onClick={() => void openReport()}
            style={{
              position: 'fixed',
              right: 16,
              bottom: 16,
              zIndex: 999,
              color: brand.navy,
              borderColor: '#d3d3d3',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          />
        </Tooltip>
      )}
      <BugReportModal key={openCount} open={open} screenshot={screenshot} onClose={close} />
    </BugReportContext.Provider>
  )
}
