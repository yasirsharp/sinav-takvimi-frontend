import { useMemo, useState } from 'react'
import { Alert, App, Button, Empty, Flex, Modal, Select, Skeleton, Tag, Typography } from 'antd'
import { UserAddOutlined } from '@ant-design/icons'
import type { Bolum } from '../../api/bolum'
import { getErrorMessage } from '../../api/errors'
import DeleteButton from '../../components/DeleteButton'
import { useCan } from '../../hooks/usePermission'
import { Yonetici } from '../../auth/roles'
import { compareTr, matchesSearch } from '../../utils/search'
import { useAkademikPersoneller } from '../akademikPersonel/queries'
import { useAssignGorevli, useBolumGorevlileri, useUnassignGorevli } from './queries'

/** Bölüm satırı genişletildiğinde görünen bölüm görevlileri listesi */
export default function BolumGorevliPanel({ bolum }: { bolum: Bolum }) {
  const canManage = useCan(Yonetici)
  const { message } = App.useApp()
  const { data: gorevliler, isLoading, error } = useBolumGorevlileri(bolum.id)
  const unassign = useUnassignGorevli(bolum.id)
  const [modalOpen, setModalOpen] = useState(false)

  if (isLoading) return <Skeleton active paragraph={{ rows: 2 }} />
  if (error) return <Alert type="error" showIcon title={getErrorMessage(error)} />

  return (
    <div style={{ padding: '4px 8px' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Typography.Text strong>Bölüm görevlileri</Typography.Text>
        {canManage && (
          <Button size="small" icon={<UserAddOutlined />} onClick={() => setModalOpen(true)}>
            Görevli ata
          </Button>
        )}
      </Flex>

      {gorevliler && gorevliler.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {gorevliler.map((gorevli) => (
            <li
              key={gorevli.relationshipId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <span>
                <Tag color="cyan">{gorevli.unvan}</Tag>
                {gorevli.ad}
              </span>
              {canManage && (
                <DeleteButton
                  itemName={`${gorevli.unvan} ${gorevli.ad}`}
                  successMessage="Görevli atama kaldırıldı."
                  onDelete={() => unassign.mutateAsync(gorevli)}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bu bölüme atanmış görevli yok." />
      )}

      {canManage && (
        <AssignGorevliModal
          bolum={bolum}
          open={modalOpen}
          excludeIds={(gorevliler ?? []).map((g) => g.id)}
          onClose={() => setModalOpen(false)}
          onAssigned={() => {
            setModalOpen(false)
            message.success('Görevli atandı.')
          }}
        />
      )}
    </div>
  )
}

interface AssignGorevliModalProps {
  bolum: Bolum
  open: boolean
  excludeIds: number[]
  onClose: () => void
  onAssigned: () => void
}

function AssignGorevliModal({ bolum, open, excludeIds, onClose, onAssigned }: AssignGorevliModalProps) {
  const { data: personeller, isLoading } = useAkademikPersoneller()
  const assign = useAssignGorevli(bolum.id)
  const [selected, setSelected] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const options = useMemo(
    () =>
      (personeller ?? [])
        .filter((p) => !excludeIds.includes(p.id))
        .sort((a, b) => compareTr(a.ad, b.ad))
        .map((p) => ({ value: p.id, label: `${p.unvan} ${p.ad}` })),
    [personeller, excludeIds],
  )

  const handleOk = async () => {
    if (!selected) return
    setError(null)
    try {
      await assign.mutateAsync(selected)
      setSelected(null)
      onAssigned()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title={`${bolum.ad} — görevli ata`}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Ata"
      cancelText="Vazgeç"
      okButtonProps={{ disabled: !selected }}
      confirmLoading={assign.isPending}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="Atanan kişiye otomatik olarak “Bölüm Görevlisi” rolü verilir."
      />
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
      <Select
        showSearch
        style={{ width: '100%' }}
        placeholder="Akademik personel seçin"
        loading={isLoading}
        options={options}
        value={selected ?? undefined}
        onChange={setSelected}
        filterOption={(input, option) => matchesSearch(input, option?.label as string)}
      />
    </Modal>
  )
}
