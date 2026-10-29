import { useMemo, useState } from 'react'
import { App, Button, Card, Form, Input, Modal, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { Bolum } from '../../api/bolum'
import { getErrorMessage } from '../../api/errors'
import PageHeader from '../../components/PageHeader'
import TableToolbar from '../../components/TableToolbar'
import DeleteButton from '../../components/DeleteButton'
import { defaultPagination } from '../../components/tableDefaults'
import { useCan } from '../../hooks/usePermission'
import { Yonetici } from '../../auth/roles'
import { compareTr, matchesSearch } from '../../utils/search'
import { useBolumler, useDeleteBolum, useSaveBolum } from './queries'
import BolumGorevliPanel from './BolumGorevliPanel'
import ImportButton from '../import/ImportButton'
import { useBolumImport } from '../import/definitions'
import { useResetFormOnOpen } from '../../hooks/useResetFormOnOpen'

export default function BolumPage() {
  const canEdit = useCan(Yonetici)
  const importDefinition = useBolumImport()
  const { data, isLoading, error } = useBolumler()
  const deleteBolum = useDeleteBolum()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Bolum | null | undefined>(undefined) // undefined: kapalı, null: yeni

  const rows = useMemo(() => (data ?? []).filter((b) => matchesSearch(search, b.ad)), [data, search])

  const columns: ColumnsType<Bolum> = [
    {
      title: 'Bölüm adı',
      dataIndex: 'ad',
      sorter: (a, b) => compareTr(a.ad, b.ad),
      defaultSortOrder: 'ascend',
    },
    ...(canEdit
      ? [
          {
            title: 'İşlemler',
            key: 'actions',
            width: 110,
            align: 'right' as const,
            render: (_: unknown, bolum: Bolum) => (
              <>
                <Tooltip title="Düzenle">
                  <Button type="text" icon={<EditOutlined />} aria-label={`${bolum.ad} düzenle`} onClick={() => setEditing(bolum)} />
                </Tooltip>
                <DeleteButton
                  itemName={bolum.ad}
                  successMessage="Bölüm silindi."
                  onDelete={() => deleteBolum.mutateAsync(bolum.id)}
                />
              </>
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <PageHeader
        title="Bölümler"
        description="Bölümler ve bölüm görevlileri. Görevlileri görmek için satırı genişletin."
        actions={
          canEdit && (
            <>
              <ImportButton definition={importDefinition} />
              <Button type="primary" icon={<PlusOutlined />} data-tour="add" onClick={() => setEditing(null)}>
                Yeni bölüm
              </Button>
            </>
          )
        }
      />

      <Card data-tour="table">
        <TableToolbar search={search} onSearchChange={setSearch} placeholder="Bölüm ara…" />
        <Table<Bolum>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isLoading}
          pagination={defaultPagination}
          expandable={{ expandedRowRender: (bolum) => <BolumGorevliPanel bolum={bolum} /> }}
          locale={{ emptyText: error ? getErrorMessage(error) : 'Kayıt bulunamadı' }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <BolumFormModal bolum={editing} onClose={() => setEditing(undefined)} />
    </>
  )
}

function BolumFormModal({ bolum, onClose }: { bolum: Bolum | null | undefined; onClose: () => void }) {
  const [form] = Form.useForm<{ ad: string }>()
  const { message } = App.useApp()
  const save = useSaveBolum()
  const open = bolum !== undefined
  useResetFormOnOpen(form, open, bolum?.id)

  const handleFinish = async ({ ad }: { ad: string }) => {
    try {
      await save.mutateAsync({ id: bolum?.id, ad: ad.trim() })
      message.success(bolum ? 'Bölüm güncellendi.' : 'Bölüm eklendi.')
      onClose()
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title={bolum ? 'Bölümü düzenle' : 'Yeni bölüm'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Kaydet"
      cancelText="Vazgeç"
      confirmLoading={save.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} preserve={false} initialValues={{ ad: bolum?.ad ?? '' }}>
        <Form.Item
          label="Bölüm adı"
          name="ad"
          rules={[
            { required: true, whitespace: true, message: 'Bölüm adını girin.' },
            { max: 200, message: 'En fazla 200 karakter.' },
          ]}
        >
          <Input autoFocus placeholder="ör. Bilgisayar Mühendisliği" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
