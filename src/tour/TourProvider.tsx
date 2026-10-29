import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Grid, Tour, Typography } from 'antd'
import type { TourProps } from 'antd'
import { useAuth } from '../auth/useAuth'
import { tours as allTours } from './tours'
import {
  GENEL_TOUR_ID,
  autoTourDisabled,
  isSeen,
  markSeen,
  resetSeen,
  stepsForRoles,
  tourForPath,
  toursForRoles,
  type TourDef,
  type TourStepDef,
} from './tourModel'
import { TourContext, type TourContextValue } from './tourContext'

/** Sayfa çizildikten, veriler gelmeye başladıktan sonra tur açılsın */
const AUTO_START_DELAY = 900
const TARGET_WAIT_MS = 5000

function selectorOf(step: TourStepDef): string | null {
  return step.selector ?? (step.target ? `[data-tour="${step.target}"]` : null)
}

/** Ekranda görünen ilk eşleşme (mobil ve masaüstü için iki ayrı öğe aynı hedefi taşıyabilir) */
function findVisible(selector: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    if (el.getClientRects().length > 0) return el
  }
  return null
}

/** Açık bir pencere (duyuru, form) varken tur kendiliğinden başlamaz */
function isModalOpen(): boolean {
  return [...document.querySelectorAll<HTMLElement>('.ant-modal-wrap')].some((el) => getComputedStyle(el).display !== 'none')
}

function StepBody({ step }: { step: TourStepDef }) {
  return (
    <>
      <Typography.Paragraph style={{ marginBottom: step.bullets ? 8 : 0 }}>{step.description}</Typography.Paragraph>
      {step.bullets && (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {step.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
    </>
  )
}

export default function TourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const isMobile = !Grid.useBreakpoint().md
  const [active, setActive] = useState<{ tour: TourDef; path: string; steps: NonNullable<TourProps['steps']> } | null>(null)
  const [current, setCurrent] = useState(0)
  const activeRef = useRef(active)
  useEffect(() => {
    activeRef.current = active
  }, [active])

  const roles = useMemo(() => user?.roles ?? [], [user])
  const tours = useMemo(() => toursForRoles(allTours, roles), [roles])
  const pageTour = useMemo(() => tourForPath(tours, location.pathname), [tours, location.pathname])

  const open = useCallback(
    (tour: TourDef) => {
      // Hedefi ekranda olmayan adımlar (yetki, boş liste, mobil) atlanır; hedefsiz adımlar ortada gösterilir
      const steps = stepsForRoles(tour, roles).flatMap((step) => {
        const selector = selectorOf(step)
        if (selector && !findVisible(selector)) return []
        return [
          {
            title: step.title,
            description: <StepBody step={step} />,
            target: selector ? () => findVisible(selector) as HTMLElement : null,
          },
        ]
      })
      if (steps.length === 0) {
        message.info('Bu ekranda gösterilecek adım yok. Ayrıntılar için Yardım sayfasına bakın.')
        return
      }
      if (user) [tour.id, ...(tour.alsoMarks ?? [])].forEach((id) => markSeen(user.id, id))
      setCurrent(0)
      setActive({ tour, path: window.location.pathname, steps })
    },
    [roles, user, message],
  )

  /** Sayfa yüklenip ilk hedef ekrana gelene kadar bekler (tembel yüklenen sayfalar) */
  const openWhenReady = useCallback(
    (tour: TourDef) => {
      const first = stepsForRoles(tour, roles).map(selectorOf).find(Boolean)
      const startedAt = Date.now()
      const tick = () => {
        if (first && !findVisible(first) && Date.now() - startedAt < TARGET_WAIT_MS) {
          window.setTimeout(tick, 200)
          return
        }
        open(tour)
      }
      window.setTimeout(tick, 300)
    },
    [open, roles],
  )

  const start = useCallback(
    (tourId: string) => {
      const tour = tours.find((t) => t.id === tourId)
      if (!tour) return
      if (tour.path !== location.pathname) navigate(`${tour.path}?tur=${tour.id}`)
      else openWhenReady(tour)
    },
    [tours, location.pathname, navigate, openWhenReady],
  )

  // Yardım merkezinden gelen "?tur=…" bağlantısı
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tourId = params.get('tur')
    if (!tourId) return
    params.delete('tur')
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
    const tour = tours.find((t) => t.id === tourId && t.path === location.pathname)
    if (tour) openWhenReady(tour)
  }, [location.search, location.pathname, navigate, tours, openWhenReady])

  // İlk girişte genel tur, bir sayfaya ilk girişte o sayfanın turu bir kez kendiliğinden açılır
  useEffect(() => {
    if (!user || user.mustChangePassword || autoTourDisabled()) return
    if (new URLSearchParams(location.search).has('tur')) return
    const genel = tours.find((t) => t.id === GENEL_TOUR_ID)
    const pending =
      location.pathname === '/' && genel && !isSeen(user.id, genel.id)
        ? genel
        : pageTour && !isSeen(user.id, pageTour.id)
          ? pageTour
          : undefined
    if (!pending) return

    let timer = 0
    const tryStart = () => {
      const now = activeRef.current
      if (now && now.path === window.location.pathname) return
      // Girişteki duyuru penceresi henüz yükleniyorsa veya açıksa bekle
      const popup = queryClient.getQueryState(['duyurular', 'popup'])
      if (popup?.fetchStatus === 'fetching' || isModalOpen()) {
        timer = window.setTimeout(tryStart, 1000)
        return
      }
      openWhenReady(pending)
    }
    timer = window.setTimeout(tryStart, AUTO_START_DELAY)
    return () => window.clearTimeout(timer)
  }, [user, location.pathname, location.search, tours, pageTour, queryClient, openWhenReady])

  const resetAll = useCallback(() => {
    if (user) resetSeen(user.id)
  }, [user])

  const value = useMemo<TourContextValue>(() => ({ start, pageTour, tours, resetAll }), [start, pageTour, tours, resetAll])

  const close = () => setActive(null)
  // Sayfa değişince açık tur gösterilmez
  const shown = active && active.path === location.pathname ? active : null

  return (
    <TourContext.Provider value={value}>
      {children}
      {shown && (
        <Tour
          open
          steps={shown.steps}
          current={current}
          onChange={setCurrent}
          onClose={close}
          onFinish={close}
          scrollIntoViewOptions={{ block: 'center', behavior: 'smooth' }}
          indicatorsRender={(c, total) => (
            <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              {isMobile ? '' : `${shown.tour.title} · `}
              {c + 1} / {total}
            </Typography.Text>
          )}
          actionsRender={(original, { current: c, total }) => (
            <>
              {/* Telefonda yer dar; kapatmak için sağ üstteki çarpı yeterli */}
              {!isMobile && c < total - 1 && (
                <Button size="small" type="text" onClick={close}>
                  Turu kapat
                </Button>
              )}
              {original}
            </>
          )}
        />
      )}
    </TourContext.Provider>
  )
}
