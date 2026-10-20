import { useMemo, useState } from 'react'
import { App, Badge, Button, Card, Form, Input, InputNumber, Modal, Switch, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { DerslikFormValues, DerslikWithBolumler } from '../../api/derslik'
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
import { useDeleteDerslik, useDerslikler, useSaveDerslik } from './queries'
import ImportButton from '../import/ImportButton'
import { useDerslikImport } from '../import/definitions'
import { useResetFormOnOpen } from '../../hooks/useResetFormOnOpen'

export default function DerslikPage() {
  const canEdit = useCan(Planlayici)
  const importDefinition = useDerslikImport()
  const { data, isLoading, error } = useDerslikler()
  const deleteDerslik = useDeleteDerslik()
  const [search, setSearch] = useState('')
  const [bolumFilter, setBolumFilter] = useDefaultBolumFilter()
  const [editing, setEditing] = useState<DerslikWithBolumler | null | undefined>(undefined)

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (derslik) =>
          matchesSearch(search, derslik.derslikAd) &&
          (bolumFilter.length === 0 ||
            derslik.ortakDerslik ||
            derslik.bolumler.some((b) => bolumFilter.includes(b.bolumId))),
      ),
    [data, search, bolumFilter],
  )

  const totalKapasite = useMemo(() => rows.reduce((sum, d) => sum + (d.status ? d.kapasite : 0), 0), [rows])

  const columns: ColumnsType<DerslikWithBolumler> = [
    {
      title: 'Derslik',
      dataIndex: 'derslikAd',
      sorter: (a, b) => compareTr(a.derslikAd, b.derslikAd),
      defaultSortOrder: 'ascend',
      render: (ad: string) => <strong>{ad}</strong>,
    },
    {
      title: 'Kapasite',
      dataIndex: 'kapasite',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.kapasite - b.kapasite,
    },
    {
      title: 'Bölümler',
      key: 'bolumler',
      render: (_, derslik) =>
        derslik.ortakDerslik ? (
          <Tag color="cyan">Ortak derslik</Tag>
        ) : (
          derslik.bolumler.map((b) => (
            <Tag key={b.bolumId} color="blue" style={{ marginBottom: 4 }}>
              {b.bolumAd}
            </Tag>
          ))
        ),
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      width: 110,
      filters: [
        { text: 'Aktif', value: true },
        { text: 'Pasif', value: false },
      ],
      onFilter: (value, derslik) => derslik.status === value,
      render: (status: boolean) =>
        status ? <Badge status="success" text="Aktif" /> : <Badge status="default" text="Pasif" />,
    },
    ...(canEdit
      ? [
          {
            title: 'İşlemler',
            key: 'actions',
            width: 110,
            align: 'right' as const,
            render: (_: unknown, derslik: DerslikWithBolumler) => (
              <>
                <Tooltip title="Düzenle">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    aria-label={`${derslik.derslikAd} düzenle`}
                    onClick={() => setEditing(derslik)}
                  />
                </Tooltip>
                <DeleteButton
                  itemName={derslik.derslikAd}
                  successMessage="Derslik silindi."
                  onDelete={() => deleteDerslik.mutateAsync(derslik.derslikId)}
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
        title="Derslikler"
        description={`Sınavların yapılabileceği derslikler. Listelenen aktif dersliklerin toplam kapasitesi: ${totalKapasite.toLocaleString('tr-TR')}`}
        actions={
          canEdit && (
            <>
              <ImportButton definition={importDefinition} />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>
                Yeni derslik
              </Button>
            </>
          )
        }
      />

      <Card>
        <TableToolbar search={search} onSearchChange={setSearch} placeholder="Derslik ara…">
          <BolumSelect
            mode="multiple"
            placeholder="Tüm bölümler"
            value={bolumFilter}
            onChange={(value) => setBolumFilter((value as number[] | undefined) ?? [])}
            style={{ minWidth: 260, maxWidth: '100%' }}
            aria-label="Bölüme göre filtrele"
          />
        </TableToolbar>
        <Table<DerslikWithBolumler>
          rowKey="derslikId"
          columns={columns}
          dataSource={rows}
          loading={isLoading}
          pagination={defaultPagination}
          locale={{ emptyText: error ? getErrorMessage(error) : 'Kayıt bulunamadı' }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <DerslikFormModal derslik={editing} onClose={() => setEditing(undefined)} />
    </>
  )
}

function DerslikFormModal({
  derslik,
  onClose,
}: {
  derslik: DerslikWithBolumler | null | undefined
  onClose: () => void
}) {
  const [form] = Form.useForm<DerslikFormValues>()
  useResetFormOnOpen(form, derslik !== undefined, derslik?.derslikId)
  const { message } = App.useApp()
  const save = useSaveDerslik()
  const ortakDerslik = Form.useWatch('ortakDerslik', form)

  const initialValues: DerslikFormValues = {
    ad: derslik?.derslikAd ?? '',
    kapasite: derslik?.kapasite ?? 30,
    ortakDerslik: derslik?.ortakDerslik ?? false,
    status: derslik?.status ?? true,
    bolumIds: derslik?.bolumler.map((b) => b.bolumId) ?? [],
  }

  const handleFinish = async (values: DerslikFormValues) => {
    try {
      await save.mutateAsync({
        id: derslik?.derslikId,
        values: { ...values, ad: values.ad.trim(), bolumIds: values.ortakDerslik ? [] : values.bolumIds },
      })
      message.success(derslik ? 'Derslik güncellendi.' : 'Derslik eklendi.')
      onClose()
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title={derslik ? 'Dersliği düzenle' : 'Yeni derslik'}
      open={derslik !== undefined}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Kaydet"
      cancelText="Vazgeç"
      confirmLoading={save.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} preserve={false} initialValues={initialValues}>
        <Form.Item
          label="Derslik adı"
          name="ad"
          rules={[
            { required: true, whitespace: true, message: 'Derslik adını girin.' },
            { max: 100, message: 'En fazla 100 karakter.' },
          ]}
        >
          <Input autoFocus placeholder="ör. MF-A101" />
        </Form.Item>

        <Form.Item
          label="Sınav kapasitesi"
          name="kapasite"
          rules={[{ required: true, type: 'number', min: 1, message: 'Kapasite en az 1 olmalı.' }]}
        >
          <InputNumber min={1} max={2000} precision={0} style={{ width: '100%' }} suffix="kişi" />
        </Form.Item>

        <Form.Item
          label="Ortak derslik"
          name="ortakDerslik"
          valuePropName="checked"
          extra="Ortak derslikler tüm bölümlerin sınavlarında kullanılabilir."
        >
          <Switch />
        </Form.Item>

        {!ortakDerslik && (
          <Form.Item
            label="Bölümler"
            name="bolumIds"
            rules={[{ required: true, type: 'array', min: 1, message: 'En az bir bölüm seçin.' }]}
          >
            <BolumSelect mode="multiple" />
          </Form.Item>
        )}

        <Form.Item label="Aktif" name="status" valuePropName="checked" extra="Pasif derslikler sınav planlamada kullanılmaz.">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
