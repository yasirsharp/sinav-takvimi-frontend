import { useMemo, useState } from 'react'
import { Alert, App, Button, Card, Collapse, Form, Modal, Select, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { DbapDetail, DbapFormValues } from '../../api/dbap'
import { getErrorMessage } from '../../api/errors'
import PageHeader from '../../components/PageHeader'
import TableToolbar from '../../components/TableToolbar'
import DeleteButton from '../../components/DeleteButton'
import BolumSelect from '../../components/BolumSelect'
import { defaultPagination } from '../../components/tableDefaults'
import { useCan } from '../../hooks/usePermission'
import { useDefaultBolumFilter } from '../../hooks/useDefaultBolumFilter'
import { Planlayici } from '../../auth/roles'
import { compareTr, matchesSearch } from '../../utils/search'
import { useDersler } from '../ders/queries'
import { useAkademikPersoneller } from '../akademikPersonel/queries'
import { useDbapList, useDeleteDbap, useSaveDbap } from './queries'
import { derslerForBolum, isDuplicateDbap, unassignedDersler } from './dbapRules'
import ImportButton from '../import/ImportButton'
import { useDbapImport } from '../import/definitions'
import { useResetFormOnOpen } from '../../hooks/useResetFormOnOpen'

export default function DbapPage() {
  const canEdit = useCan(Planlayici)
  const importDefinition = useDbapImport()
  const { data, isLoading, error } = useDbapList()
  const { data: dersler } = useDersler()
  const { data: personeller } = useAkademikPersoneller()
  const deleteDbap = useDeleteDbap()
  const [search, setSearch] = useState('')
  const [bolumFilter, setBolumFilter] = useDefaultBolumFilter()
  const [personelFilter, setPersonelFilter] = useState<number | undefined>()
  const [editing, setEditing] = useState<DbapDetail | null | undefined>(undefined)

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (x) =>
          matchesSearch(search, x.dersAd, x.dersKodu, x.bolumAd, x.akademikPersonelAd) &&
          (bolumFilter.length === 0 || bolumFilter.includes(x.bolumId)) &&
          (!personelFilter || x.akademikPersonelId === personelFilter),
      ),
    [data, search, bolumFilter, personelFilter],
  )

  const missing = useMemo(
    () => (data && dersler ? unassignedDersler(dersler, data, bolumFilter) : []),
    [data, dersler, bolumFilter],
  )

  const personelOptions = useMemo(
    () =>
      [...(personeller ?? [])]
        .sort((a, b) => compareTr(a.ad, b.ad))
        .map((p) => ({ value: p.id, label: `${p.unvan} ${p.ad}` })),
    [personeller],
  )

  const columns: ColumnsType<DbapDetail> = [
    {
      title: 'Ders',
      key: 'ders',
      sorter: (a, b) => compareTr(a.dersKodu, b.dersKodu),
      render: (_, x) => (
        <span>
          <strong style={{ marginRight: 8 }}>{x.dersKodu}</strong>
          {x.dersAd}
        </span>
      ),
    },
    {
      title: 'Bölüm',
      dataIndex: 'bolumAd',
      sorter: (a, b) => compareTr(a.bolumAd, b.bolumAd),
      defaultSortOrder: 'ascend',
      render: (ad: string) => <Tag color="blue">{ad}</Tag>,
    },
    {
      title: 'Öğretim elemanı',
      key: 'personel',
      sorter: (a, b) => compareTr(a.akademikPersonelAd, b.akademikPersonelAd),
      render: (_, x) => (
        <span>
          <Tag color="cyan">{x.unvan}</Tag>
          {x.akademikPersonelAd}
        </span>
      ),
    },
    ...(canEdit
      ? [
          {
            title: 'İşlemler',
            key: 'actions',
            width: 110,
            align: 'right' as const,
            render: (_: unknown, x: DbapDetail) => (
              <>
                <Tooltip title="Düzenle">
                  <Button type="text" icon={<EditOutlined />} aria-label={`${x.dersKodu} ${x.bolumAd} düzenle`} onClick={() => setEditing(x)} />
                </Tooltip>
                <DeleteButton
                  itemName={`${x.dersKodu} – ${x.bolumAd} – ${x.akademikPersonelAd}`}
                  successMessage="Ders ataması silindi."
                  onDelete={() => deleteDbap.mutateAsync(x.id)}
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
        title="Ders Atamaları"
        description="Hangi dersi hangi bölümde hangi öğretim elemanının verdiği. Sınavlar bu atamalar üzerinden eklenir."
        actions={
          canEdit && (
            <>
              <ImportButton definition={importDefinition} />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>
                Yeni atama
              </Button>
            </>
          )
        }
      />

      {missing.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title={`${missing.length} ders için henüz öğretim elemanı atanmamış; bu derslerin sınavı eklenemez.`}
          description={
            <Collapse
              ghost
              size="small"
              items={[
                {
                  key: 'list',
                  label: 'Dersleri göster',
                  children: missing.map((m) => (
                    <Tag key={`${m.bolumId}-${m.ders.dersId}`} style={{ marginBottom: 4 }}>
                      {m.ders.kod} {m.ders.dersAd} · {m.bolumAd}
                    </Tag>
                  )),
                },
              ]}
            />
          }
        />
      )}

      <Card>
        <TableToolbar search={search} onSearchChange={setSearch} placeholder="Ders, bölüm veya öğretim elemanı ara…">
          <BolumSelect
            mode="multiple"
            placeholder="Tüm bölümler"
            value={bolumFilter}
            onChange={(value) => setBolumFilter((value as number[] | undefined) ?? [])}
            style={{ minWidth: 240, maxWidth: '100%' }}
            aria-label="Bölüme göre filtrele"
          />
          <Select
            showSearch
            allowClear
            placeholder="Tüm öğretim elemanları"
            options={personelOptions}
            value={personelFilter}
            onChange={setPersonelFilter}
            filterOption={(input, option) => matchesSearch(input, option?.label as string)}
            style={{ minWidth: 240, maxWidth: '100%' }}
            aria-label="Öğretim elemanına göre filtrele"
          />
        </TableToolbar>
        <Table<DbapDetail>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isLoading}
          pagination={defaultPagination}
          locale={{ emptyText: error ? getErrorMessage(error) : 'Kayıt bulunamadı' }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <DbapFormModal
        dbap={editing}
        existing={data ?? []}
        personelOptions={personelOptions}
        defaultBolumId={bolumFilter.length === 1 ? bolumFilter[0] : undefined}
        onClose={() => setEditing(undefined)}
      />
    </>
  )
}

interface DbapFormModalProps {
  dbap: DbapDetail | null | undefined
  existing: DbapDetail[]
  personelOptions: { value: number; label: string }[]
  defaultBolumId?: number
  onClose: () => void
}

function DbapFormModal({ dbap, existing, personelOptions, defaultBolumId, onClose }: DbapFormModalProps) {
  const [form] = Form.useForm<DbapFormValues>()
  useResetFormOnOpen(form, dbap !== undefined, dbap?.id)
  const { message } = App.useApp()
  const save = useSaveDbap()
  const { data: dersler, isLoading: derslerLoading } = useDersler()
  const bolumId = Form.useWatch('bolumId', form)

  const dersOptions = useMemo(
    () =>
      derslerForBolum(dersler ?? [], bolumId)
        .sort((a, b) => compareTr(a.kod, b.kod))
        .map((d) => ({ value: d.dersId, label: `${d.kod ?? ''} ${d.dersAd}${d.ortakDers ? ' (ortak)' : ''}`.trim() })),
    [dersler, bolumId],
  )

  const handleFinish = async (values: DbapFormValues) => {
    try {
      await save.mutateAsync({ id: dbap?.id, values })
      message.success(dbap ? 'Ders ataması güncellendi.' : 'Ders ataması eklendi.')
      onClose()
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title={dbap ? 'Ders atamasını düzenle' : 'Yeni ders ataması'}
      open={dbap !== undefined}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Kaydet"
      cancelText="Vazgeç"
      confirmLoading={save.isPending}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        preserve={false}
        initialValues={{
          bolumId: dbap?.bolumId ?? defaultBolumId,
          dersId: dbap?.dersId,
          akademikPersonelId: dbap?.akademikPersonelId,
        }}
        onValuesChange={(changed) => {
          // Bölüm değişince o bölümde verilmeyen ders seçimini temizle
          if ('bolumId' in changed) form.setFieldValue('dersId', undefined)
        }}
      >
        <Form.Item label="Bölüm" name="bolumId" rules={[{ required: true, message: 'Bölüm seçin.' }]}>
          <BolumSelect />
        </Form.Item>

        <Form.Item
          label="Ders"
          name="dersId"
          extra="Bölümün dersleri ve ortak dersler listelenir."
          rules={[{ required: true, message: 'Ders seçin.' }]}
        >
          <Select
            showSearch
            disabled={!bolumId}
            loading={derslerLoading}
            placeholder={bolumId ? 'Ders seçin' : 'Önce bölüm seçin'}
            options={dersOptions}
            filterOption={(input, option) => matchesSearch(input, option?.label as string)}
          />
        </Form.Item>

        <Form.Item
          label="Öğretim elemanı"
          name="akademikPersonelId"
          dependencies={['bolumId', 'dersId']}
          rules={[
            { required: true, message: 'Öğretim elemanı seçin.' },
            ({ getFieldsValue }) => ({
              validator: async () => {
                const values = getFieldsValue() as DbapFormValues
                if (values.bolumId && values.dersId && values.akademikPersonelId && isDuplicateDbap(existing, values, dbap?.id)) {
                  throw new Error('Bu ders bu bölümde zaten bu öğretim elemanına atanmış.')
                }
              },
            }),
          ]}
        >
          <Select
            showSearch
            placeholder="Öğretim elemanı seçin"
            options={personelOptions}
            filterOption={(input, option) => matchesSearch(input, option?.label as string)}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
