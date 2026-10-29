import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Card, Col, Empty, Flex, Row, Skeleton, Statistic, Steps, Tag, Typography } from 'antd'
import {
  ApartmentOutlined,
  BankOutlined,
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../auth/useAuth'
import { useCan } from '../hooks/usePermission'
import { Personel, Planlayici, Roles, roleLabel } from '../auth/roles'
import { ANNOUNCEMENT_TYPES, PRIORITIES } from '../api/announcement'
import type { SinavDetay } from '../api/sinav'
import { brand } from '../theme'
import { useSinavlar } from '../features/sinav/queries'
import { formatDateParam, hasGozetmen } from '../features/sinav/sinavUtils'
import { useDerslikler } from '../features/derslik/queries'
import { useDbapList } from '../features/dbap/queries'
import { useBolumler } from '../features/bolum/queries'
import { useDersler } from '../features/ders/queries'
import { useAkademikPersoneller, useOwnPersonel } from '../features/akademikPersonel/queries'
import { useOgrenciler } from '../features/ogrenci/queries'
import { useMyDuyurular } from '../features/duyuru/queries'
import { unassignedDersler } from '../features/dbap/dbapRules'
import { useDefaultBolumFilter } from '../hooks/useDefaultBolumFilter'
import TourButton from '../tour/TourButton'

const cardStyle = { borderTop: `4px solid ${brand.turquoise}`, height: '100%' }

export default function DashboardPage() {
  const { user } = useAuth()
  const isPersonel = useCan(Personel)
  const isPlanlayici = useCan(Planlayici)
  if (!user) return null

  const isOgrenci = user.roles.includes(Roles.Ogrenci) && !isPersonel

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Flex align="center" gap={4} style={{ marginBottom: 4 }}>
          <Typography.Title level={3} style={{ margin: 0, color: brand.navy }}>
            Hoş geldiniz, {user.name || user.email}
          </Typography.Title>
          <TourButton />
        </Flex>
        <Flex gap={4} wrap data-tour="dashboard-roles" style={{ width: 'fit-content' }}>
          {user.roles.length ? (
            user.roles.map((r) => (
              <Tag key={r} color={brand.navy}>
                {roleLabel(r)}
              </Tag>
            ))
          ) : (
            <Tag>Rol atanmamış</Tag>
          )}
          {user.ogrenciNo && <Tag>Öğrenci No: {user.ogrenciNo}</Tag>}
        </Flex>
        {user.roles.length === 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
            title="Hesabınıza henüz rol atanmamış. Sınav takvimini görebilmek için yöneticinize başvurun."
          />
        )}
      </Col>

      {isPlanlayici && (
        <Col span={24}>
          <PlannerOverview />
        </Col>
      )}

      <Col xs={24} lg={14} data-tour="dashboard-mine">
        {isOgrenci ? <StudentExams /> : isPersonel ? <MyDuties /> : null}
      </Col>
      <Col xs={24} lg={isOgrenci || isPersonel ? 10 : 24} data-tour="dashboard-announcements">
        <AnnouncementsCard />
      </Col>
    </Row>
  )
}

const today = () => dayjs().startOf('day')

/** Sınavları gün gün listeler */
function ExamList({
  exams,
  derslikAd,
  extra,
  empty,
}: {
  exams: SinavDetay[]
  derslikAd: Map<number, string>
  extra?: (s: SinavDetay) => React.ReactNode
  empty: string
}) {
  const byDay = useMemo(() => {
    const sorted = [...exams].sort((a, b) =>
      `${a.sinavTarihi.slice(0, 10)}${a.sinavBaslangicSaati}`.localeCompare(`${b.sinavTarihi.slice(0, 10)}${b.sinavBaslangicSaati}`),
    )
    const groups = new Map<string, SinavDetay[]>()
    for (const s of sorted) groups.set(s.sinavTarihi.slice(0, 10), [...(groups.get(s.sinavTarihi.slice(0, 10)) ?? []), s])
    return [...groups.entries()]
  }, [exams])

  if (byDay.length === 0) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} />

  return (
    <Flex vertical gap={12}>
      {byDay.map(([day, list]) => {
        const d = dayjs(day)
        return (
          <div key={day}>
            <Typography.Text strong style={{ color: brand.navy }}>
              {d.format('D MMMM dddd')}
              {d.isSame(today(), 'day') && <Tag color="red" style={{ marginLeft: 8 }}>Bugün</Tag>}
              {d.isSame(today().add(1, 'day'), 'day') && <Tag color="orange" style={{ marginLeft: 8 }}>Yarın</Tag>}
            </Typography.Text>
            {list.map((s) => (
              <Flex key={s.id} gap={12} align="baseline" style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }} wrap>
                <Typography.Text style={{ width: 96, fontVariantNumeric: 'tabular-nums' }}>
                  {s.sinavBaslangicSaati.slice(0, 5)}–{s.sinavBitisSaati.slice(0, 5)}
                </Typography.Text>
                <Flex vertical style={{ flex: 1, minWidth: 180 }}>
                  <Typography.Text strong>{s.dersAd}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {s.derslikler.map((d) => derslikAd.get(d.derslikId) ?? `#${d.derslikId}`).join(', ') || 'Derslik yok'} · {s.bolumAd}
                  </Typography.Text>
                </Flex>
                {extra?.(s)}
              </Flex>
            ))}
          </div>
        )
      })}
    </Flex>
  )
}

function useDerslikAdlari() {
  const { data } = useDerslikler()
  return useMemo(() => new Map((data ?? []).map((d) => [d.derslikId, d.derslikAd])), [data])
}

function StudentExams() {
  const start = formatDateParam(today())
  const end = formatDateParam(today().add(30, 'day'))
  const { data, isLoading } = useSinavlar(start, end)
  const derslikAd = useDerslikAdlari()
  return (
    <Card
      title={
        <>
          <CalendarOutlined /> Yaklaşan sınavlarım
        </>
      }
      extra={<Link to="/sinav-takvimi">Takvim</Link>}
      style={cardStyle}
    >
      {isLoading ? (
        <Skeleton active />
      ) : (
        <ExamList exams={data ?? []} derslikAd={derslikAd} empty="Önümüzdeki 30 günde bölümünüzün sınavı yok." />
      )}
    </Card>
  )
}

function MyDuties() {
  const own = useOwnPersonel()
  const start = formatDateParam(today())
  const end = formatDateParam(today().add(14, 'day'))
  const { data, isLoading } = useSinavlar(start, end)
  const { data: dbap } = useDbapList()
  const derslikAd = useDerslikAdlari()

  const personelId = own.personel?.id
  // Personel kaydı olmayan planlayıcı (ör. sistem yöneticisi) kendi görevleri yerine yaklaşan tüm sınavları görür
  const isPlanlayici = useCan(Planlayici)
  const [bolumFilter] = useDefaultBolumFilter()
  const showAll = own.noRecord && isPlanlayici
  const dbapPersonel = useMemo(() => new Map((dbap ?? []).map((x) => [x.id, x.akademikPersonelId])), [dbap])
  const mine = useMemo(
    () =>
      (data ?? []).filter(
        (s) =>
          personelId != null &&
          (dbapPersonel.get(s.dersBolumAkademikPersonelId) === personelId || s.derslikler.some((d) => d.gozetmenId === personelId)),
      ),
    [data, personelId, dbapPersonel],
  )

  if (showAll) {
    const upcoming = (data ?? []).filter((s) => !bolumFilter.length || bolumFilter.includes(s.bolumId))
    return (
      <Card
        title={
          <>
            <CalendarOutlined /> Yaklaşan sınavlar (14 gün)
          </>
        }
        extra={<Link to="/sinav-takvimi">Takvim</Link>}
        style={cardStyle}
      >
        {isLoading ? (
          <Skeleton active />
        ) : (
          <ExamList
            exams={upcoming}
            derslikAd={derslikAd}
            empty="Önümüzdeki 14 günde sınav yok."
            extra={(s) =>
              s.derslikler.some((d) => !hasGozetmen(d.gozetmenId)) ? <Tag color="orange">Gözetmen eksik</Tag> : null
            }
          />
        )}
      </Card>
    )
  }

  return (
    <Card
      title={
        <>
          <CalendarOutlined /> Sınav görevlerim (14 gün)
        </>
      }
      extra={
        <Flex gap={12}>
          <Link to="/musaitlik">
            <ClockCircleOutlined /> Müsaitlik
          </Link>
          <Link to="/sinav-takvimi">Takvim</Link>
        </Flex>
      }
      style={cardStyle}
    >
      {own.noRecord ? (
        <Typography.Text type="secondary">Hesabınıza bağlı akademik personel kaydı yok; kişisel görev listesi gösterilemiyor.</Typography.Text>
      ) : isLoading || own.isLoading ? (
        <Skeleton active />
      ) : (
        <ExamList
          exams={mine}
          derslikAd={derslikAd}
          empty="Önümüzdeki 14 günde dersini verdiğiniz veya gözetmen olduğunuz sınav yok."
          extra={(s) => {
            const gozetmen = s.derslikler.filter((d) => d.gozetmenId === personelId)
            const ogretim = dbapPersonel.get(s.dersBolumAkademikPersonelId) === personelId
            return (
              <Flex gap={4} wrap>
                {ogretim && <Tag color="blue">Dersin hocası</Tag>}
                {gozetmen.map((d) => (
                  <Tag key={d.derslikId} color="purple">
                    Gözetmen · {derslikAd.get(d.derslikId)}
                  </Tag>
                ))}
              </Flex>
            )
          }}
        />
      )}
    </Card>
  )
}

function PlannerOverview() {
  const { data: bolumler } = useBolumler()
  const { data: dersler } = useDersler()
  const { data: derslikler } = useDerslikler()
  const { data: personeller } = useAkademikPersoneller()
  const { data: ogrenciler } = useOgrenciler()
  const { data: dbap } = useDbapList()
  const [bolumFilter] = useDefaultBolumFilter()
  const weekStart = dayjs().startOf('week')
  const { data: haftaSinavlari } = useSinavlar(formatDateParam(weekStart), formatDateParam(weekStart.add(6, 'day')))
  const { data: yaklasan } = useSinavlar(formatDateParam(today()), formatDateParam(today().add(14, 'day')))

  const atanmamis = useMemo(
    () => (dersler && dbap ? unassignedDersler(dersler, dbap, bolumFilter).length : undefined),
    [dersler, dbap, bolumFilter],
  )
  const gozetmensiz = useMemo(
    () =>
      (yaklasan ?? [])
        .filter((s) => !bolumFilter.length || bolumFilter.includes(s.bolumId))
        .reduce((n, s) => n + s.derslikler.filter((d) => !hasGozetmen(d.gozetmenId)).length, 0),
    [yaklasan, bolumFilter],
  )

  const steps = [
    { title: 'Bölümler', path: '/tanimlar/bolumler', count: bolumler?.length },
    { title: 'Derslikler', path: '/tanimlar/derslikler', count: derslikler?.length },
    { title: 'Dersler', path: '/tanimlar/dersler', count: dersler?.length },
    { title: 'Akademik personel', path: '/tanimlar/akademik-personel', count: personeller?.length },
    { title: 'Ders atamaları', path: '/tanimlar/ders-atamalari', count: dbap?.length },
    { title: 'Öğrenciler', path: '/tanimlar/ogrenciler', count: ogrenciler?.length },
  ]
  const firstMissing = steps.findIndex((s) => s.count === 0)

  const stats = [
    { title: 'Bu haftaki sınavlar', value: haftaSinavlari?.length, icon: <CalendarOutlined />, to: '/sinav-takvimi' },
    { title: 'Bölüm', value: bolumler?.length, icon: <ApartmentOutlined />, to: '/tanimlar/bolumler' },
    { title: 'Ders', value: dersler?.length, icon: <BookOutlined />, to: '/tanimlar/dersler' },
    { title: 'Derslik', value: derslikler?.length, icon: <BankOutlined />, to: '/tanimlar/derslikler' },
    { title: 'Akademik personel', value: personeller?.length, icon: <TeamOutlined />, to: '/tanimlar/akademik-personel' },
    { title: 'Öğrenci', value: ogrenciler?.length, icon: <IdcardOutlined />, to: '/tanimlar/ogrenciler' },
  ]

  return (
    <Flex vertical gap={16}>
      {firstMissing >= 0 && (
        <Card title="Kurulum adımları" style={{ borderTop: `4px solid ${brand.navy}` }} data-tour="dashboard-setup">
          <Typography.Paragraph type="secondary">
            Sınav planlamaya başlamadan önce tanımları bu sırayla girin. Her ekranda <strong>Excel'den aktar</strong> ile
            toplu giriş yapabilirsiniz.
          </Typography.Paragraph>
          <Steps
            size="small"
            current={firstMissing}
            items={steps.map((s, i) => ({
              title: <Link to={s.path}>{s.title}</Link>,
              content: s.count == null ? '…' : `${s.count} kayıt`,
              status: s.count ? 'finish' : i === firstMissing ? 'process' : 'wait',
            }))}
          />
        </Card>
      )}

      <Row gutter={[16, 16]} data-tour="dashboard-stats">
        {stats.map((s) => (
          <Col key={s.title} xs={12} sm={8} xl={4}>
            <Link to={s.to}>
              <Card size="small" hoverable style={{ borderTop: `3px solid ${brand.turquoise}` }}>
                <Statistic title={s.title} value={s.value ?? '–'} prefix={s.icon} />
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      {(!!atanmamis || gozetmensiz > 0) && (
        <Flex vertical gap={8} data-tour="dashboard-alerts">
          {!!atanmamis && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              title={
                <>
                  {atanmamis} dersin öğretim elemanı atanmamış; bu derslerin sınavı eklenemez.{' '}
                  <Link to="/tanimlar/ders-atamalari">Ders atamalarına git</Link>
                </>
              }
            />
          )}
          {gozetmensiz > 0 && (
            <Alert
              type="info"
              showIcon
              title={
                <>
                  Önümüzdeki 14 günde {gozetmensiz} derslikte gözetmen atanmamış. <Link to="/sinav-takvimi">Sınav takvimine git</Link>
                </>
              }
            />
          )}
        </Flex>
      )}
    </Flex>
  )
}

function AnnouncementsCard() {
  const { data, isLoading } = useMyDuyurular()
  return (
    <Card title="Duyurular" style={cardStyle}>
      {isLoading ? (
        <Skeleton active />
      ) : !data?.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Yayında duyuru yok" />
      ) : (
        <Flex vertical gap={12}>
          {data.slice(0, 8).map((a) => (
            <div key={a.id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
              <Flex gap={6} align="center" wrap>
                <Typography.Text strong>{a.title}</Typography.Text>
                {ANNOUNCEMENT_TYPES[a.type] && <Tag color={ANNOUNCEMENT_TYPES[a.type].color}>{ANNOUNCEMENT_TYPES[a.type].label}</Tag>}
                {a.priority > 0 && !(a.type === 'urgent' && a.priority === 2) && (
                  <Tag color={a.priority === 2 ? 'red' : 'gold'}>{PRIORITIES[a.priority]}</Tag>
                )}
              </Flex>
              <Typography.Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'devamı' }} style={{ margin: '4px 0', whiteSpace: 'pre-line' }}>
                {a.content}
              </Typography.Paragraph>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(a.publishDate).format('D MMMM YYYY')}
                {a.targetBolum ? ` · ${a.targetBolum.ad}` : ''}
              </Typography.Text>
            </div>
          ))}
        </Flex>
      )}
    </Card>
  )
}
