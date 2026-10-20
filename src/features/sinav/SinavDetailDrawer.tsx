import { Button, Descriptions, Drawer, Flex, Popconfirm, Tag, Typography } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { SinavDetay } from '../../api/sinav'
import { useDerslikler } from '../derslik/queries'
import { useAkademikPersoneller } from '../akademikPersonel/queries'
import { bolumRengi, hasGozetmen } from './sinavUtils'

interface Props {
  sinav: SinavDetay | null
  canEdit: boolean
  deleting: boolean
  onClose: () => void
  onEdit: (sinav: SinavDetay) => void
  onDelete: (sinav: SinavDetay) => Promise<void>
}

export default function SinavDetailDrawer({ sinav, canEdit, deleting, onClose, onEdit, onDelete }: Props) {
  const { data: derslikler } = useDerslikler()
  const { data: personeller } = useAkademikPersoneller()
  const derslik = (id: number) => derslikler?.find((d) => d.derslikId === id)
  const personel = (id: number) => personeller?.find((p) => p.id === id)

  const toplamKapasite = sinav?.derslikler.reduce((s, d) => s + (derslik(d.derslikId)?.kapasite ?? 0), 0) ?? 0

  return (
    <Drawer
      open={!!sinav}
      onClose={onClose}
      size={460}
      title={sinav?.dersAd}
      extra={sinav && <Tag color={bolumRengi(sinav.bolumId)}>{sinav.bolumAd}</Tag>}
      footer={
        sinav &&
        canEdit && (
          <Flex justify="end" gap={8}>
            <Popconfirm
              title="Sınavı silmek istediğinize emin misiniz?"
              okText="Sil"
              okButtonProps={{ danger: true, loading: deleting }}
              cancelText="Vazgeç"
              onConfirm={() => onDelete(sinav)}
            >
              <Button danger icon={<DeleteOutlined />}>
                Sil
              </Button>
            </Popconfirm>
            <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(sinav)}>
              Düzenle
            </Button>
          </Flex>
        )
      }
    >
      {sinav && (
        <>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Tarih">{dayjs(sinav.sinavTarihi).format('DD MMMM YYYY, dddd')}</Descriptions.Item>
            <Descriptions.Item label="Saat">
              {sinav.sinavBaslangicSaati.slice(0, 5)} – {sinav.sinavBitisSaati.slice(0, 5)}
            </Descriptions.Item>
            <Descriptions.Item label="Öğretim elemanı">
              {sinav.unvan} {sinav.akademikPersonelAd}
            </Descriptions.Item>
            <Descriptions.Item label="Toplam kapasite">{toplamKapasite} kişi</Descriptions.Item>
          </Descriptions>

          <Typography.Title level={5} style={{ marginTop: 24 }}>
            Derslikler
          </Typography.Title>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {sinav.derslikler.map((d) => {
              const g = hasGozetmen(d.gozetmenId) ? personel(d.gozetmenId) : undefined
              return (
                <li key={d.derslikId} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Flex justify="space-between" wrap gap={8}>
                    <span>
                      <strong>{derslik(d.derslikId)?.derslikAd ?? `Derslik #${d.derslikId}`}</strong>{' '}
                      <Typography.Text type="secondary">({derslik(d.derslikId)?.kapasite ?? '?'} kişi)</Typography.Text>
                    </span>
                    {g ? (
                      <span>
                        <Tag color="cyan">{g.unvan}</Tag>
                        {g.ad}
                      </span>
                    ) : (
                      <Tag>Gözetmen atanmamış</Tag>
                    )}
                  </Flex>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Drawer>
  )
}
