import { useMemo, useState } from 'react'
import { App, Button, Card, Collapse, Empty, Flex, Input, Tag, Typography } from 'antd'
import { CompassOutlined, PlayCircleOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../auth/useAuth'
import { ROLE_COLORS, ROLE_DESCRIPTIONS, roleLabel } from '../auth/roles'
import { brand } from '../theme'
import { faq, tours as allTours } from '../tour/tours'
import { GENEL_TOUR_ID, searchFaq, searchTours, stepsForRoles, toursForRoles } from '../tour/tourModel'
import { useTour } from '../tour/tourContext'

/** Aranabilir yardım merkezi: her ekranın özellikleri tur kaydından üretilir, oradan tur başlatılır */
export default function HelpPage() {
  const { user } = useAuth()
  const tour = useTour()
  const { message } = App.useApp()
  const [term, setTerm] = useState('')

  const roles = useMemo(() => user?.roles ?? [], [user])
  const tours = useMemo(() => tour?.tours ?? toursForRoles(allTours, roles), [tour, roles])
  const foundTours = useMemo(() => searchTours(tours, term, roles), [tours, term, roles])
  const foundFaq = useMemo(() => searchFaq(faq, term, roles), [term, roles])
  const searching = term.trim().length > 0

  const tourItems = foundTours.map((t) => ({
    key: t.id,
    label: (
      <Flex vertical>
        <Typography.Text strong>{t.title}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {t.summary}
        </Typography.Text>
      </Flex>
    ),
    children: (
      <Flex vertical gap={12}>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {stepsForRoles(t, roles).map((s, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              <Typography.Text strong>{s.title.endsWith('?') ? `${s.title} ` : `${s.title}: `}</Typography.Text>
              <Typography.Text>{s.description}</Typography.Text>
              {s.bullets && (
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
        {tour && (
          <div>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => tour.start(t.id)}>
              {t.id === GENEL_TOUR_ID ? 'Genel turu başlat' : 'Sayfaya git ve turu başlat'}
            </Button>
          </div>
        )}
      </Flex>
    ),
  }))

  const faqItems = foundFaq.map((f) => ({
    key: f.question,
    label: <Typography.Text strong>{f.question}</Typography.Text>,
    children: <Typography.Paragraph style={{ margin: 0 }}>{f.answer}</Typography.Paragraph>,
  }))

  return (
    <>
      <PageHeader
        title="Yardım merkezi"
        description="Aradığınız özelliği yazın; açıklamasını okuyun veya ekranına gidip adım adım turunu başlatın."
        actions={
          tour && (
            <>
              <Button icon={<CompassOutlined />} onClick={() => tour.start(GENEL_TOUR_ID)}>
                Genel tanıtım turu
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  tour.resetAll()
                  message.success('Sayfa turları sıfırlandı; her ekranı açtığınızda turu yeniden gösterilecek.')
                }}
              >
                Turları yeniden göster
              </Button>
            </>
          )
        }
      />

      <Flex vertical gap={16}>
        <Input
          size="large"
          allowClear
          autoFocus
          prefix={<SearchOutlined />}
          placeholder="Ne yapmak istiyorsunuz? ör. sınav taşı, parola sıfırla, Excel, gözetmen, müsait değilim"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          aria-label="Yardımda ara"
          data-tour="help-search"
          style={{ maxWidth: 720 }}
        />

        {!searching && roles.length > 0 && (
          <Card size="small" title="Rolleriniz ve yapabilecekleriniz" style={{ borderTop: `3px solid ${brand.turquoise}` }}>
            <Flex vertical gap={6}>
              {roles.map((r) => (
                <div key={r}>
                  <Tag color={ROLE_COLORS[r]}>{roleLabel(r)}</Tag>
                  <Typography.Text type="secondary">{ROLE_DESCRIPTIONS[r]}</Typography.Text>
                </div>
              ))}
            </Flex>
          </Card>
        )}

        {tourItems.length === 0 && faqItems.length === 0 ? (
          <Card>
            <Empty description={`"${term}" için sonuç bulunamadı. Başka bir kelime deneyin veya "Sorun bildir" ile bize yazın.`} />
          </Card>
        ) : (
          <>
            {tourItems.length > 0 && (
              <Card title="Ekranlar ve özellikler" styles={{ body: { padding: 0 } }}>
                {/* Aramada bulunan konular açık gelir; arama değişince liste yeniden kurulur */}
                <Collapse ghost items={tourItems} defaultActiveKey={searching ? foundTours.map((t) => t.id) : []} key={`ara-${term}`} />
              </Card>
            )}
            {faqItems.length > 0 && (
              <Card title="Sık sorulanlar" styles={{ body: { padding: 0 } }}>
                <Collapse ghost items={faqItems} defaultActiveKey={searching ? faqItems.map((f) => f.key) : []} key={`ara-${term}`} />
              </Card>
            )}
          </>
        )}
      </Flex>
    </>
  )
}
