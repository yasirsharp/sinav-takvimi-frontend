import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, App, Button, Card, Empty, Flex, Input, Modal, Segmented, Space, Spin, Tag, Typography } from 'antd'
import { CalendarOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { SinavTalep, TalepDurum } from '../../api/talep'
import { getErrorMessage } from '../../api/errors'
import PageHeader from '../../components/PageHeader'
import { useCan } from '../../hooks/usePermission'
import { Planlayici } from '../../auth/roles'
import { useErrorToast } from '../../bugReport/useErrorToast'
import { useAnswerTalep, useTalepler } from './queries'

type Filtre = 'bekliyor' | 'hepsi'

const DURUM: Record<TalepDurum, { color: string; label: string }> = {
  bekliyor: { color: 'gold', label: 'Yanıt bekliyor' },
  kabul: { color: 'green', label: 'Kabul edildi' },
  red: { color: 'red', label: 'Reddedildi' },
}

const saat = (v?: string | null) => (v ? v.slice(0, 5) : '')

function oneri(t: SinavTalep) {
  const parts = [
    t.onerilenTarih ? dayjs(t.onerilenTarih).format('DD MMMM YYYY, dddd') : '',
    t.onerilenBaslangic ? `${saat(t.onerilenBaslangic)}${t.onerilenBitis ? `–${saat(t.onerilenBitis)}` : ''}` : '',
  ].filter(Boolean)
  return parts.join(' · ')
}

/**
 * Sınav değişiklik talepleri. Hoca kendi taleplerini izler; bölüm görevlisi kendi bölümünün, yönetici tüm taleplerini
 * kabul eder ya da reddeder. Kabul etmek sınavı kendiliğinden değiştirmez: "Sınavı aç" ile takvimde düzenlenir.
 */
export default function TalepPage() {
  const planlayici = useCan(Planlayici)
  const navigate = useNavigate()
  const { data, isLoading, error } = useTalepler()
  const [filtre, setFiltre] = useState<Filtre>('bekliyor')
  const [yanit, setYanit] = useState<{ talep: SinavTalep; durum: 'kabul' | 'red' } | null>(null)

  const rows = useMemo(() => (data ?? []).filter((t) => filtre === 'hepsi' || t.durum === 'bekliyor'), [data, filtre])
  const bekleyen = (data ?? []).filter((t) => t.durum === 'bekliyor').length

  return (
    <>
      <PageHeader
        title={planlayici ? 'Talepler' : 'Taleplerim'}
        description={
          planlayici
            ? 'Hocaların ve gözetmenlerin sınav değişiklik istekleri. Kabul ettikten sonra sınavı takvimde düzenleyin.'
            : 'Sınavlarınız için istediğiniz değişiklikler. Yeni istek için Sınavlarım ekranında sınava tıklayıp "Değişiklik iste" deyin.'
        }
        actions={
          <Segmented<Filtre>
            value={filtre}
            onChange={setFiltre}
            options={[
              { value: 'bekliyor', label: `Bekleyen (${bekleyen})` },
              { value: 'hepsi', label: 'Tümü' },
            ]}
          />
        }
      />

      {error && <Alert type="error" showIcon title={getErrorMessage(error)} style={{ marginBottom: 16 }} />}

      {isLoading ? (
        <Spin style={{ display: 'block', margin: '48px auto' }} />
      ) : rows.length === 0 ? (
        <Card>
          <Empty
            description={
              filtre === 'bekliyor'
                ? 'Yanıt bekleyen talep yok.'
                : planlayici
                  ? 'Henüz talep yok.'
                  : 'Henüz talebiniz yok. Sınavlarım ekranında bir sınava tıklayıp "Değişiklik iste" diyebilirsiniz.'
            }
          />
        </Card>
      ) : (
        <Flex vertical gap={12} data-testid="talep-listesi">
          {rows.map((t) => (
            <Card key={t.id} size="small" data-testid={`talep-${t.id}`}>
              <Flex justify="space-between" wrap gap={12} align="flex-start">
                <div style={{ minWidth: 0, flex: '1 1 380px' }}>
                  <Space wrap size={6} style={{ marginBottom: 4 }}>
                    <Tag color={DURUM[t.durum].color}>{DURUM[t.durum].label}</Tag>
                    {t.bolumAd && <Tag>{t.bolumAd}</Tag>}
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(t.createdDate).format('DD.MM.YYYY HH:mm')}
                    </Typography.Text>
                  </Space>
                  <Typography.Text strong style={{ display: 'block' }}>
                    {t.sinavOzeti}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    {t.benim ? 'Siz' : t.talepEdenAd} · {t.gorev === 'gozetmen' ? 'gözetmen' : 'dersin öğretim elemanı'}
                  </Typography.Text>
                  <Typography.Paragraph style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{t.neden}</Typography.Paragraph>
                  {oneri(t) && (
                    <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                      Önerilen zaman: <strong>{oneri(t)}</strong>
                    </Typography.Text>
                  )}
                  {t.durum !== 'bekliyor' && (
                    <Alert
                      style={{ marginTop: 8 }}
                      type={t.durum === 'kabul' ? 'success' : 'warning'}
                      title={
                        <>
                          {t.yanitlayanAd ?? 'Görevli'}: {t.yanitNotu || (t.durum === 'kabul' ? 'Kabul edildi.' : 'Reddedildi.')}
                          {t.yanitTarihi && (
                            <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                              {dayjs(t.yanitTarihi).format('DD.MM.YYYY HH:mm')}
                            </Typography.Text>
                          )}
                        </>
                      }
                    />
                  )}
                </div>
                <Flex gap={8} wrap>
                  {t.sinavVar ? (
                    <Button
                      icon={<CalendarOutlined />}
                      onClick={() =>
                        navigate(`/sinav-takvimi?sinav=${t.sinavDetayId}${t.sinavTarihi ? `&tarih=${dayjs(t.sinavTarihi).format('YYYY-MM-DD')}` : ''}`)
                      }
                    >
                      {t.yanitlayabilir ? 'Sınavı aç' : 'Sınavı gör'}
                    </Button>
                  ) : (
                    <Tag>Sınav silinmiş</Tag>
                  )}
                  {t.yanitlayabilir && t.durum === 'bekliyor' && (
                    <>
                      <Button danger icon={<CloseOutlined />} onClick={() => setYanit({ talep: t, durum: 'red' })}>
                        Reddet
                      </Button>
                      <Button type="primary" icon={<CheckOutlined />} onClick={() => setYanit({ talep: t, durum: 'kabul' })}>
                        Kabul et
                      </Button>
                    </>
                  )}
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      )}

      <YanitModal yanit={yanit} onClose={() => setYanit(null)} />
    </>
  )
}

function YanitModal({ yanit, onClose }: { yanit: { talep: SinavTalep; durum: 'kabul' | 'red' } | null; onClose: () => void }) {
  const { message } = App.useApp()
  const showError = useErrorToast()
  const answer = useAnswerTalep()
  const [not, setNot] = useState('')
  const red = yanit?.durum === 'red'

  const submit = async () => {
    if (!yanit) return
    if (red && !not.trim()) {
      message.warning('Reddederken kısa bir gerekçe yazın.')
      return
    }
    try {
      await answer.mutateAsync({ id: yanit.talep.id, durum: yanit.durum, not: not.trim() || undefined })
      message.success(red ? 'Talep reddedildi; hocaya bildirim gitti.' : 'Talep kabul edildi; hocaya bildirim gitti. Sınavı takvimde düzenlemeyi unutmayın.')
      setNot('')
      onClose()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Modal
      open={!!yanit}
      title={red ? 'Talebi reddet' : 'Talebi kabul et'}
      okText={red ? 'Reddet' : 'Kabul et'}
      okButtonProps={{ danger: red }}
      cancelText="Vazgeç"
      confirmLoading={answer.isPending}
      onOk={submit}
      onCancel={() => {
        setNot('')
        onClose()
      }}
      destroyOnHidden
    >
      {yanit && (
        <Typography.Paragraph type="secondary">
          {yanit.talep.talepEdenAd}: {yanit.talep.sinavOzeti}
        </Typography.Paragraph>
      )}
      <Input.TextArea
        rows={3}
        maxLength={1000}
        value={not}
        onChange={(e) => setNot(e.target.value)}
        aria-label="Yanıt notu"
        placeholder={red ? 'Neden olmuyor? (zorunlu)' : 'İsteğe bağlı not, ör. "Perşembe 14:00\'e aldım."'}
      />
    </Modal>
  )
}
