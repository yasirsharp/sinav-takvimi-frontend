import { useMemo, useState } from 'react'
import { App, Button, Card, Form, Input, Modal, Switch, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { dersApi, type DersFormValues, type DersWithBolumler } from '../../api/ders'
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
import { DERS_KODU_PATTERN as KOD_PATTERN, normalizeDersKodu } from '../../utils/dersKodu'
import { useDeleteDers, useDersler, useSaveDers } from './queries'

export default function DersPage() {
  const canEdit = useCan(Planlayici)
  const { data, isLoading, error } = useDersler()
  const deleteDers = useDeleteDers()
  const [search, setSearch] = useState('')
  const [bolumFilter, setBolumFilter] = useDefaultBolumFilter()
  const [editing, setEditing] = useState<DersWithBolumler | null | undefined>(undefined)

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (ders) =>
          matchesSearch(search, ders.dersAd, ders.kod) &&
          // Ortak dersler her bölümde kullanılabildiği için filtrede de görünür
          (bolumFilter.length === 0 || ders.ortakDers || ders.bolumler.some((b) => bolumFilter.includes(b.bolumId))),
      ),
    [data, search, bolumFilter],
  )

  const columns: ColumnsType<DersWithBolumler> = [
    {
      title: 'Kod',
      dataIndex: 'kod',
      width: 120,
      sorter: (a, b) => compareTr(a.kod, b.kod),
      render: (kod: string | null) => <strong>{kod ?? '-'}</strong>,
    },
    {
      title: 'Ders adı',
      dataIndex: 'dersAd',
      sorter: (a, b) => compareTr(a.dersAd, b.dersAd),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Bölümler',
      key: 'bolumler',
      render: (_, ders) =>
        ders.ortakDers ? (
          <Tag color="cyan">Ortak ders</Tag>
        ) : (
          ders.bolumler.map((b) => (
            <Tag key={b.bolumId} color="blue" style={{ marginBottom: 4 }}>
              {b.bolumAd}
            </Tag>
          ))
        ),
    },
    ...(canEdit
      ? [
          {
            title: 'İşlemler',
            key: 'actions',
            width: 110,
            align: 'right' as const,
            render: (_: unknown, ders: DersWithBolumler) => (
              <>
                <Tooltip title="Düzenle">
                  <Button type="text" icon={<EditOutlined />} aria-label={`${ders.dersAd} düzenle`} onClick={() => setEditing(ders)} />
                </Tooltip>
                <DeleteButton
                  itemName={`${ders.kod ?? ''} ${ders.dersAd}`.trim()}
                  successMessage="Ders silindi."
                  onDelete={() => deleteDers.mutateAsync(ders.dersId)}
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
        title="Dersler"
        description="Ders kodları ve dersin verildiği bölümler. Bölümü olmayan dersler ortak derstir."
        actions={
          canEdit && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>
              Yeni ders
            </Button>
          )
        }
      />

      <Card>
        <TableToolbar search={search} onSearchChange={setSearch} placeholder="Kod veya ders adı ara…">
          <BolumSelect
            mode="multiple"
            placeholder="Tüm bölümler"
            value={bolumFilter}
            onChange={(value) => setBolumFilter((value as number[] | undefined) ?? [])}
            style={{ minWidth: 260, maxWidth: '100%' }}
            aria-label="Bölüme göre filtrele"
          />
        </TableToolbar>
        <Table<DersWithBolumler>
          rowKey="dersId"
          columns={columns}
          dataSource={rows}
          loading={isLoading}
          pagination={defaultPagination}
          locale={{ emptyText: error ? getErrorMessage(error) : 'Kayıt bulunamadı' }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <DersFormModal ders={editing} onClose={() => setEditing(undefined)} />
    </>
  )
}

function DersFormModal({ ders, onClose }: { ders: DersWithBolumler | null | undefined; onClose: () => void }) {
  const [form] = Form.useForm<DersFormValues>()
  const { message } = App.useApp()
  const save = useSaveDers()
  const ortakDers = Form.useWatch('ortakDers', form)

  const initialValues: DersFormValues = {
    ad: ders?.dersAd ?? '',
    kod: ders?.kod ?? '',
    ortakDers: ders?.ortakDers ?? false,
    bolumIds: ders?.bolumler.map((b) => b.bolumId) ?? [],
  }

  const handleFinish = async (values: DersFormValues) => {
    try {
      await save.mutateAsync({
        id: ders?.dersId,
        values: {
          ad: values.ad.trim(),
          kod: values.kod,
          ortakDers: values.ortakDers,
          bolumIds: values.ortakDers ? [] : values.bolumIds,
        },
      })
      message.success(ders ? 'Ders güncellendi.' : 'Ders eklendi.')
      onClose()
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title={ders ? 'Dersi düzenle' : 'Yeni ders'}
      open={ders !== undefined}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Kaydet"
      cancelText="Vazgeç"
      confirmLoading={save.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} preserve={false} initialValues={initialValues}>
        <Form.Item
          label="Ders kodu"
          name="kod"
          normalize={normalizeDersKodu}
          validateDebounce={400}
          extra="Sadece büyük harf ve rakam, ör. BLM101"
          rules={[
            { required: true, message: 'Ders kodunu girin.' },
            { min: 2, max: 50, message: '2–50 karakter olmalı.' },
            { pattern: KOD_PATTERN, message: 'Sadece büyük harf ve rakam kullanılabilir.' },
            {
              validator: async (_, value: string) => {
                if (!value || !KOD_PATTERN.test(value)) return
                const unique = await dersApi.isKodUnique(value, ders?.dersId)
                if (!unique) throw new Error('Bu ders kodu başka bir derste kullanılıyor.')
              },
            },
          ]}
        >
          <Input autoFocus placeholder="BLM101" maxLength={50} />
        </Form.Item>

        <Form.Item
          label="Ders adı"
          name="ad"
          rules={[
            { required: true, whitespace: true, message: 'Ders adını girin.' },
            { min: 2, max: 200, message: '2–200 karakter olmalı.' },
          ]}
        >
          <Input placeholder="ör. Veri Yapıları" />
        </Form.Item>

        <Form.Item
          label="Ortak ders"
          name="ortakDers"
          valuePropName="checked"
          extra="Ortak dersler belirli bir bölüme bağlı değildir (ör. Türk Dili, Yabancı Dil)."
        >
          <Switch />
        </Form.Item>

        {!ortakDers && (
          <Form.Item
            label="Bölümler"
            name="bolumIds"
            rules={[{ required: true, type: 'array', min: 1, message: 'En az bir bölüm seçin.' }]}
          >
            <BolumSelect mode="multiple" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
