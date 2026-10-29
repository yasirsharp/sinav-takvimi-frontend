import { useMemo, useState } from 'react'
import { Alert, App, Button, Card, Flex, Form, Input, InputNumber, Modal, Select, Switch, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { Ogrenci, OgrenciCreateValues } from '../../api/ogrenci'
import { getErrorMessage } from '../../api/errors'
import PageHeader from '../../components/PageHeader'
import TableToolbar from '../../components/TableToolbar'
import DeleteButton from '../../components/DeleteButton'
import BolumSelect from '../../components/BolumSelect'
import CredentialsModal, { type CredentialsInfo } from '../../components/CredentialsModal'
import { defaultPagination } from '../../components/tableDefaults'
import { useCan } from '../../hooks/usePermission'
import { useDefaultBolumFilter } from '../../hooks/useDefaultBolumFilter'
import { Yonetici } from '../../auth/roles'
import { compareTr, matchesSearch } from '../../utils/search'
import { useBolumler } from '../bolum/queries'
import { useCreateOgrenci, useDeleteOgrenci, useOgrenciler, useUpdateOgrenci } from './queries'
import ImportButton from '../import/ImportButton'
import { useOgrenciImport } from '../import/definitions'
import { useResetFormOnOpen } from '../../hooks/useResetFormOnOpen'

const SINIFLAR = [1, 2, 3, 4, 5, 6]

interface FormValues {
  ogrenciNo: string
  ad: string
  soyad: string
  email?: string
  bolumId: number
  sinif?: number | null
  status: boolean
}

export default function OgrenciPage() {
  const canEdit = useCan(Yonetici)
  const importDefinition = useOgrenciImport()
  const { data, isLoading, error } = useOgrenciler()
  const { data: bolumler } = useBolumler()
  const deleteOgrenci = useDeleteOgrenci()
  const [search, setSearch] = useState('')
  const [bolumFilter, setBolumFilter] = useDefaultBolumFilter()
  const [sinifFilter, setSinifFilter] = useState<number | null>(null)
  const [editing, setEditing] = useState<Ogrenci | null | undefined>(undefined)
  const [credentials, setCredentials] = useState<CredentialsInfo | null>(null)

  const bolumAd = useMemo(() => new Map((bolumler ?? []).map((b) => [b.id, b.ad])), [bolumler])

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (o) =>
          matchesSearch(search, o.ogrenciNo, `${o.ad} ${o.soyad}`) &&
          (bolumFilter.length === 0 || bolumFilter.includes(o.bolumId)) &&
          (sinifFilter == null || o.sinif === sinifFilter),
      ),
    [data, search, bolumFilter, sinifFilter],
  )

  const columns: ColumnsType<Ogrenci> = [
    {
      title: 'Öğrenci No',
      dataIndex: 'ogrenciNo',
      width: 140,
      sorter: (a, b) => a.ogrenciNo.localeCompare(b.ogrenciNo, 'tr', { numeric: true }),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Ad Soyad',
      key: 'name',
      sorter: (a, b) => compareTr(`${a.ad} ${a.soyad}`, `${b.ad} ${b.soyad}`),
      render: (_, o) => (
        <>
          {o.ad} {o.soyad} {!o.status && <Tag>pasif</Tag>}
        </>
      ),
    },
    {
      title: 'Bölüm',
      dataIndex: 'bolumId',
      sorter: (a, b) => compareTr(bolumAd.get(a.bolumId) ?? '', bolumAd.get(b.bolumId) ?? ''),
      render: (id: number) => bolumAd.get(id) ?? `#${id}`,
    },
    { title: 'Sınıf', dataIndex: 'sinif', width: 80, render: (s?: number | null) => (s ? `${s}. sınıf` : '-') },
    ...(canEdit
      ? [
          {
            title: 'İşlemler',
            key: 'actions',
            width: 110,
            align: 'right' as const,
            render: (_: unknown, o: Ogrenci) => (
              <>
                <Tooltip title="Düzenle">
                  <Button type="text" icon={<EditOutlined />} aria-label={`${o.ad} ${o.soyad} düzenle`} onClick={() => setEditing(o)} />
                </Tooltip>
                <DeleteButton
                  itemName={`${o.ogrenciNo} ${o.ad} ${o.soyad}`}
                  successMessage="Öğrenci silindi; kullanıcı hesabı pasifleştirildi."
                  onDelete={() => deleteOgrenci.mutateAsync(o.id)}
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
        title="Öğrenciler"
        description="Öğrenciler sistemde sadece kendi bölümlerinin sınav takvimini görür. Kullanıcı adı öğrenci numarasıdır."
        actions={
          canEdit && (
            <>
              <ImportButton definition={importDefinition} />
              <Button type="primary" icon={<PlusOutlined />} data-tour="add" onClick={() => setEditing(null)}>
                Yeni öğrenci
              </Button>
            </>
          )
        }
      />

      <Card data-tour="table">
        <TableToolbar search={search} onSearchChange={setSearch} placeholder="Öğrenci no veya ad ara…">
          <BolumSelect
            mode="multiple"
            value={bolumFilter}
            onChange={(v) => setBolumFilter((v as number[]) ?? [])}
            placeholder="Tüm bölümler"
            style={{ minWidth: 220 }}
          />
          <Select<number>
            allowClear
            placeholder="Tüm sınıflar"
            value={sinifFilter ?? undefined}
            onChange={(v) => setSinifFilter(v ?? null)}
            options={SINIFLAR.map((s) => ({ value: s, label: `${s}. sınıf` }))}
            style={{ width: 140 }}
          />
        </TableToolbar>
        <Table<Ogrenci>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isLoading}
          pagination={defaultPagination}
          locale={{ emptyText: error ? getErrorMessage(error) : 'Kayıt bulunamadı' }}
          scroll={{ x: 'max-content' }}
          rowClassName={(o) => (o.status ? '' : 'du-row-passive')}
        />
      </Card>

      <OgrenciFormModal
        ogrenci={editing}
        onClose={() => setEditing(undefined)}
        onCreated={(owner, userName, password) => setCredentials({ owner, userName, password })}
      />
      <CredentialsModal title="Öğrenci eklendi" credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  )
}

interface OgrenciFormModalProps {
  ogrenci: Ogrenci | null | undefined
  onClose: () => void
  onCreated: (owner: string, userName: string, password: string) => void
}

function OgrenciFormModal({ ogrenci, onClose, onCreated }: OgrenciFormModalProps) {
  const [form] = Form.useForm<FormValues>()
  useResetFormOnOpen(form, ogrenci !== undefined, ogrenci?.id)
  const { message } = App.useApp()
  const create = useCreateOgrenci()
  const update = useUpdateOgrenci()

  const handleFinish = async (values: FormValues) => {
    const cleaned: OgrenciCreateValues = {
      ogrenciNo: values.ogrenciNo.trim(),
      ad: values.ad.trim(),
      soyad: values.soyad.trim(),
      bolumId: values.bolumId,
      sinif: values.sinif ?? null,
    }
    try {
      if (ogrenci) {
        await update.mutateAsync({ id: ogrenci.id, values: { ...cleaned, status: values.status } })
        message.success('Öğrenci güncellendi.')
      } else {
        const account = await create.mutateAsync({ ...cleaned, email: values.email?.trim() || null })
        onCreated(`${cleaned.ad} ${cleaned.soyad}`, account.userName, account.temporaryPassword)
      }
      onClose()
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title={ogrenci ? 'Öğrenciyi düzenle' : 'Yeni öğrenci'}
      open={ogrenci !== undefined}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Kaydet"
      cancelText="Vazgeç"
      confirmLoading={create.isPending || update.isPending}
      destroyOnHidden
    >
      {!ogrenci && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title="Öğrenci için kullanıcı hesabı ve geçici parola oluşturulur. Kullanıcı adı öğrenci numarasıdır."
        />
      )}
      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        preserve={false}
        initialValues={
          ogrenci
            ? { ...ogrenci, sinif: ogrenci.sinif ?? undefined }
            : { status: true }
        }
      >
        <Form.Item
          label="Öğrenci numarası"
          name="ogrenciNo"
          rules={[
            { required: true, whitespace: true, message: 'Öğrenci numarasını girin.' },
            { pattern: /^[A-Za-z0-9]{1,20}$/, message: 'Sadece harf ve rakam, en fazla 20 karakter.' },
          ]}
        >
          <Input autoFocus placeholder="ör. 2026123456" />
        </Form.Item>
        <Flex gap={12}>
          <Form.Item label="Ad" name="ad" style={{ flex: 1 }} rules={[{ required: true, whitespace: true, message: 'Ad girin.' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Soyad" name="soyad" style={{ flex: 1 }} rules={[{ required: true, whitespace: true, message: 'Soyad girin.' }]}>
            <Input />
          </Form.Item>
        </Flex>
        <Form.Item label="Bölüm" name="bolumId" rules={[{ required: true, message: 'Bölüm seçin.' }]}>
          <BolumSelect allowClear={false} />
        </Form.Item>
        <Form.Item label="Sınıf" name="sinif">
          <InputNumber min={1} max={8} style={{ width: 120 }} />
        </Form.Item>
        {!ogrenci && (
          <Form.Item
            label="E-posta"
            name="email"
            rules={[{ type: 'email', message: 'Geçerli bir e-posta girin.' }]}
            extra="Boş bırakılırsa öğrenci numarası@ogr.duzce.edu.tr kullanılır."
          >
            <Input />
          </Form.Item>
        )}
        {ogrenci && (
          <Form.Item label="Aktif" name="status" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
