import { useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import trLocale from '@fullcalendar/core/locales/tr'
import type { DateSelectArg, DatesSetArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import { Alert, App, Button, Card, Dropdown, Flex, Grid, Select, Switch, Typography } from 'antd'
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { SinavDetay } from '../../api/sinav'
import { downloadReport, type ReportType } from '../../api/report'
import { getErrorMessage } from '../../api/errors'
import PageHeader from '../../components/PageHeader'
import BolumSelect from '../../components/BolumSelect'
import { useAuth } from '../../auth/useAuth'
import { useCan } from '../../hooks/usePermission'
import { useDefaultBolumFilter } from '../../hooks/useDefaultBolumFilter'
import { Personel, Planlayici } from '../../auth/roles'
import { compareTr, matchesSearch } from '../../utils/search'
import { useDbapList } from '../dbap/queries'
import { useDerslikler } from '../derslik/queries'
import { useDeleteSinav, useSaveSinav, useSinavlar } from './queries'
import { useOwnPersonel } from '../akademikPersonel/queries'
import { bolumRengi, formatDateParam, formatTimeParam, hasGozetmen, toDateTime } from './sinavUtils'
import SinavFormModal, { type SinavFormDefaults } from './SinavFormModal'
import SinavDetailDrawer from './SinavDetailDrawer'
import './calendar.css'

/** personelOnly: gözetmen ve derslik raporları personel bilgisi içerir, öğrencilere kapalıdır */
const RAPORLAR: { key: ReportType; label: string; dosya: string; personelOnly?: boolean }[] = [
  { key: 'official-sinav-report', label: 'Resmi sınav takvimi', dosya: 'Sinav_Takvimi' },
  { key: 'gozetmen-assignment-report', label: 'Gözetmen görevlendirme', dosya: 'Gozetmen_Atama', personelOnly: true },
  { key: 'derslik-usage-report', label: 'Derslik kullanımı', dosya: 'Derslik_Kullanim', personelOnly: true },
]

export default function SinavTakvimiPage() {
  const { user } = useAuth()
  const { message } = App.useApp()
  const canEdit = useCan(Planlayici)
  const isPersonel = useCan(Personel)
  const screens = Grid.useBreakpoint()
  const calendarRef = useRef<FullCalendar>(null)
  // Grid.useBreakpoint ilk çizimde boş döner; FullCalendar başlangıç görünümünü sadece bir kez okuduğu için
  // ekran genişliği doğrudan ölçülür (telefonda saat ızgarası yerine liste görünümü)
  const [initialView] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches ? 'listWeek' : 'timeGridWeek',
  )

  const [range, setRange] = useState<{ start: string; end: string } | null>(null)
  const [bolumFilter, setBolumFilter] = useDefaultBolumFilter()
  const [derslikFilter, setDerslikFilter] = useState<number | undefined>()
  const [sadeceBenim, setSadeceBenim] = useState(false)
  const [selected, setSelected] = useState<SinavDetay | null>(null)
  const [editing, setEditing] = useState<SinavDetay | null | undefined>(undefined)
  const [defaults, setDefaults] = useState<SinavFormDefaults | undefined>()
  const [raporYukleniyor, setRaporYukleniyor] = useState(false)

  const { data: sinavlar, isFetching, error } = useSinavlar(range?.start ?? null, range?.end ?? null)
  const { data: dbapList } = useDbapList()
  const { data: derslikler } = useDerslikler()
  const save = useSaveSinav()
  const deleteSinav = useDeleteSinav()

  // Öğrenciler sadece kendi bölümlerinin sınavlarını görür; bölüm filtresi değiştirilemez
  const etkinBolumFilter = useMemo(() => (isPersonel ? bolumFilter : user?.bolumIds ?? []), [isPersonel, bolumFilter, user])

  // "Sadece benim sınavlarım": dersini verdiğim veya gözetmen olduğum sınavlar
  const { personel: benimKaydim } = useOwnPersonel()

  const dbapPersonel = useMemo(() => new Map((dbapList ?? []).map((x) => [x.id, x.akademikPersonelId])), [dbapList])
  const dbapKod = useMemo(() => new Map((dbapList ?? []).map((x) => [x.id, x.dersKodu])), [dbapList])
  const derslikAd = useMemo(() => new Map((derslikler ?? []).map((d) => [d.derslikId, d.derslikAd])), [derslikler])

  const gorunenSinavlar = useMemo(
    () =>
      (sinavlar ?? []).filter((s) => {
        if (etkinBolumFilter.length && !etkinBolumFilter.includes(s.bolumId)) return false
        if (derslikFilter && !s.derslikler.some((d) => d.derslikId === derslikFilter)) return false
        if (sadeceBenim && benimKaydim) {
          const benim =
            dbapPersonel.get(s.dersBolumAkademikPersonelId) === benimKaydim.id ||
            s.derslikler.some((d) => d.gozetmenId === benimKaydim.id)
          if (!benim) return false
        }
        return true
      }),
    [sinavlar, etkinBolumFilter, derslikFilter, sadeceBenim, benimKaydim, dbapPersonel],
  )

  const events: EventInput[] = useMemo(
    () =>
      gorunenSinavlar.map((s) => {
        const kod = dbapKod.get(s.dersBolumAkademikPersonelId)
        const yerler = s.derslikler.map((d) => derslikAd.get(d.derslikId) ?? `#${d.derslikId}`).join(', ')
        return {
          id: String(s.id),
          title: `${kod ? `${kod} ` : ''}${s.dersAd}`,
          start: toDateTime(s.sinavTarihi, s.sinavBaslangicSaati),
          end: toDateTime(s.sinavTarihi, s.sinavBitisSaati),
          backgroundColor: bolumRengi(s.bolumId),
          borderColor: bolumRengi(s.bolumId),
          extendedProps: { sinav: s, yerler },
        }
      }),
    [gorunenSinavlar, dbapKod, derslikAd],
  )

  const derslikOptions = useMemo(
    () =>
      [...(derslikler ?? [])]
        .sort((a, b) => compareTr(a.derslikAd, b.derslikAd))
        .map((d) => ({ value: d.derslikId, label: d.derslikAd })),
    [derslikler],
  )

  const handleDatesSet = (arg: DatesSetArg) => {
    // FullCalendar'ın bitişi hariçtir; API'ye son günü veriyoruz
    setRange({ start: formatDateParam(arg.start), end: formatDateParam(dayjs(arg.end).subtract(1, 'day')) })
  }

  const openNew = (start?: Date, end?: Date) => {
    setDefaults({ start, end, bolumId: etkinBolumFilter.length === 1 ? etkinBolumFilter[0] : undefined })
    setEditing(null)
  }

  /** Sürükle-bırak veya boyutlandırma: sadece tarih ve saat değişir, backend çakışmayı kontrol eder */
  const handleMove = async (arg: EventDropArg | EventResizeDoneArg) => {
    const sinav = arg.event.extendedProps.sinav as SinavDetay
    const start = arg.event.start!
    const end = arg.event.end ?? dayjs(start).add(1, 'hour').toDate()
    if (!dayjs(start).isSame(end, 'day')) {
      arg.revert()
      message.warning('Sınav başka bir güne taşmamalı.')
      return
    }
    try {
      await save.mutateAsync({
        id: sinav.id,
        values: {
          dersBolumAkademikPersonelId: sinav.dersBolumAkademikPersonelId,
          sinavTarihi: formatDateParam(start),
          sinavBaslangicSaati: formatTimeParam(start),
          sinavBitisSaati: formatTimeParam(end),
          derslikler: sinav.derslikler.map((d) => ({ derslikId: d.derslikId, gozetmenId: hasGozetmen(d.gozetmenId) ? d.gozetmenId : null })),
        },
      })
      message.success(`Sınav ${dayjs(start).format('DD.MM HH:mm')} saatine taşındı.`)
    } catch (err) {
      arg.revert()
      message.error(getErrorMessage(err), 6)
    }
  }

  const handleRapor = async (type: ReportType) => {
    if (!range) return
    const rapor = RAPORLAR.find((r) => r.key === type)!
    setRaporYukleniyor(true)
    try {
      await downloadReport(
        type,
        { startDate: range.start, endDate: range.end, bolumIds: etkinBolumFilter },
        `${rapor.dosya}_${range.start}_${range.end}.pdf`,
      )
    } catch (err) {
      message.error(getErrorMessage(err))
    } finally {
      setRaporYukleniyor(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Sınav Takvimi"
        description={
          range && (
            <>
              {dayjs(range.start).format('DD MMMM')} – {dayjs(range.end).format('DD MMMM YYYY')} arasında{' '}
              <strong>{gorunenSinavlar.length}</strong> sınav
              {canEdit && screens.md && ' · Yeni sınav için takvimde saat aralığı seçebilir, sınavları sürükleyerek taşıyabilirsiniz.'}
            </>
          )
        }
        actions={
          <>
            <Dropdown
              menu={{
                items: RAPORLAR.filter((r) => isPersonel || !r.personelOnly).map((r) => ({ key: r.key, label: r.label })),
                onClick: ({ key }) => handleRapor(key as ReportType),
              }}
              disabled={!range}
              trigger={['click']}
            >
              <Button icon={<DownloadOutlined />} loading={raporYukleniyor} data-tour="sinav-report">
                PDF rapor
              </Button>
            </Dropdown>
            {canEdit && (
              <Button type="primary" icon={<PlusOutlined />} data-tour="add" onClick={() => openNew()}>
                Yeni sınav
              </Button>
            )}
          </>
        }
      />

      <Card>
        <Flex gap={12} wrap style={{ marginBottom: 16 }} align="center" data-tour="sinav-filters">
          {isPersonel && (
            <BolumSelect
              mode="multiple"
              placeholder="Tüm bölümler"
              value={bolumFilter}
              onChange={(value) => setBolumFilter((value as number[] | undefined) ?? [])}
              style={{ minWidth: 240, maxWidth: '100%' }}
              aria-label="Bölüme göre filtrele"
            />
          )}
          <Select
            showSearch
            allowClear
            placeholder="Tüm derslikler"
            options={derslikOptions}
            value={derslikFilter}
            onChange={setDerslikFilter}
            filterOption={(input, option) => matchesSearch(input, option?.label as string)}
            style={{ minWidth: 200, maxWidth: '100%' }}
            aria-label="Dersliğe göre filtrele"
          />
          {isPersonel && benimKaydim && (
            <Flex gap={8} align="center" data-tour="sinav-mine">
              <Switch checked={sadeceBenim} onChange={setSadeceBenim} aria-label="Sadece benim sınavlarım" />
              <Typography.Text>Sadece benim sınavlarım</Typography.Text>
            </Flex>
          )}
        </Flex>

        {error && <Alert type="error" showIcon title={getErrorMessage(error)} style={{ marginBottom: 16 }} />}

        <div className="du-calendar" data-tour="sinav-calendar" style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .2s' }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            locale={trLocale}
            initialView={initialView}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: screens.md === false ? 'listWeek,dayGridMonth' : 'timeGridWeek,dayGridMonth,listWeek',
            }}
            buttonText={{ today: 'Bugün', week: 'Hafta', month: 'Ay', list: 'Liste' }}
            firstDay={1}
            slotMinTime="08:00:00"
            slotMaxTime="22:00:00"
            slotDuration="00:30:00"
            snapDuration="00:05:00"
            allDaySlot={false}
            nowIndicator
            height="auto"
            expandRows
            events={events}
            datesSet={handleDatesSet}
            eventClick={(arg: EventClickArg) => setSelected(arg.event.extendedProps.sinav as SinavDetay)}
            selectable={canEdit}
            selectMirror
            select={(arg: DateSelectArg) => {
              arg.view.calendar.unselect()
              if (arg.allDay) openNew(dayjs(arg.start).hour(9).toDate(), dayjs(arg.start).hour(10).toDate())
              else openNew(arg.start, arg.end)
            }}
            editable={canEdit}
            eventDrop={handleMove}
            eventResize={handleMove}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            eventContent={(arg) => {
              const s = arg.event.extendedProps.sinav as SinavDetay
              const yerler = arg.event.extendedProps.yerler as string
              if (arg.view.type.startsWith('list')) {
                return (
                  <span>
                    <strong>{arg.event.title}</strong> · {s.bolumAd} · {yerler}
                  </span>
                )
              }
              return (
                <div style={{ overflow: 'hidden' }} title={`${arg.event.title}\n${s.bolumAd}\n${yerler}`}>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>{arg.timeText}</div>
                  <div style={{ fontWeight: 600 }}>{arg.event.title}</div>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>{yerler}</div>
                </div>
              )
            }}
            noEventsContent="Bu aralıkta sınav yok."
          />
        </div>
      </Card>

      <SinavDetailDrawer
        sinav={selected}
        canEdit={canEdit}
        deleting={deleteSinav.isPending}
        onClose={() => setSelected(null)}
        onEdit={(s) => {
          setSelected(null)
          setEditing(s)
        }}
        onDelete={async (s) => {
          try {
            await deleteSinav.mutateAsync(s.id)
            message.success('Sınav silindi.')
            setSelected(null)
          } catch (err) {
            message.error(getErrorMessage(err))
          }
        }}
      />

      <SinavFormModal sinav={editing} defaults={defaults} onClose={() => setEditing(undefined)} />
    </>
  )
}
