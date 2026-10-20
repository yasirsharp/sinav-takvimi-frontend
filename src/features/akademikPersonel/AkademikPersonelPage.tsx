import { useMemo, useState } from 'react'
import { Alert, App, AutoComplete, Button, Card, Form, Input, Modal, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { AkademikPersonel, AkademikPersonelFormValues } from '../../api/akademikPersonel'
import { getErrorMessage } from '../../api/errors'
import PageHeader from '../../components/PageHeader'
import TableToolbar from '../../components/TableToolbar'
import DeleteButton from '../../components/DeleteButton'
import { defaultPagination } from '../../components/tableDefaults'
import { useCan } from '../../hooks/usePermission'
import { Yonetici } from '../../auth/roles'
import { compareTr, matchesSearch } from '../../utils/search'
import { parseTemporaryCredentials } from '../../utils/tempPassword'
import CredentialsModal, { type CredentialsInfo } from '../../components/CredentialsModal'
import type { CreatedAccount } from '../../api/account'
import { useAkademikPersoneller, useDeleteAkademikPersonel, useSaveAkademikPersonel } from './queries'

/** Yaygın akademik unvanlar (serbest giriş de yapılabilir) */
const UNVANLAR = [
  'Prof. Dr.',
  'Doç. Dr.',
  'Dr. Öğr. Üyesi',
  'Öğr. Gör. Dr.',
  'Öğr. Gör.',
  'Arş. Gör. Dr.',
  'Arş. Gör.',
]

export default function AkademikPersonelPage() {
  const canEdit = useCan(Yonetici)
  const { message } = App.useApp()
  const { data, isLoading, error } = useAkademikPersoneller()
  const deletePersonel = useDeleteAkademikPersonel()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<AkademikPersonel | null | undefined>(undefined)
  const [credentials, setCredentials] = useState<CredentialsInfo | null>(null)

  const rows = useMemo(() => (data ?? []).filter((p) => matchesSearch(search, p.ad, p.unvan)), [data, search])

  const unvanFilters = useMemo(
    () =>
      [...new Set((data ?? []).map((p) => p.unvan).filter(Boolean))]
        .sort(compareTr)
        .map((unvan) => ({ text: unvan, value: unvan })),
    [data],
  )

  const columns: ColumnsType<AkademikPersonel> = [
    {
      title: 'Unvan',
      dataIndex: 'unvan',
      width: 180,
      filters: unvanFilters,
      onFilter: (value, p) => p.unvan === value,
      sorter: (a, b) => compareTr(a.unvan, b.unvan),
      render: (unvan: string) => <Tag color="cyan">{unvan}</Tag>,
    },
    {
      title: 'Ad Soyad',
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
            render: (_: unknown, personel: AkademikPersonel) => (
              <>
                <Tooltip title="Düzenle">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    aria-label={`${personel.ad} düzenle`}
                    onClick={() => setEditing(personel)}
                  />
                </Tooltip>
                <DeleteButton
                  itemName={`${personel.unvan} ${personel.ad}`}
                  successMessage="Akademik personel silindi."
                  onDelete={() => deletePersonel.mutateAsync(personel.id)}
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
        title="Akademik Personel"
        description="Sınavlarda dersin sorumlusu veya gözetmen olarak atanabilecek personel."
        actions={
          canEdit && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>
              Yeni personel
            </Button>
          )
        }
      />

      <Card>
        <TableToolbar search={search} onSearchChange={setSearch} placeholder="Ad veya unvan ara…" />
        <Table<AkademikPersonel>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isLoading}
          pagination={defaultPagination}
          locale={{ emptyText: error ? getErrorMessage(error) : 'Kayıt bulunamadı' }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <PersonelFormModal
        personel={editing}
        onClose={() => setEditing(undefined)}
        onCreated={(ad, account, resultMessage) => {
          const parsed = account
            ? { userName: account.userName, password: account.temporaryPassword }
            : parseTemporaryCredentials(resultMessage)
          if (parsed) setCredentials({ ...parsed, owner: ad })
          else message.success(resultMessage || 'Akademik personel eklendi.')
        }}
      />

      <CredentialsModal title="Personel eklendi" credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  )
}

interface PersonelFormModalProps {
  personel: AkademikPersonel | null | undefined
  onClose: () => void
  /** Yeni personel eklendiğinde backend yanıtıyla çağrılır (geçici parola data'da veya eski backend'de mesajda) */
  onCreated: (ad: string, account: CreatedAccount | null | undefined, message: string | null | undefined) => void
}

function PersonelFormModal({ personel, onClose, onCreated }: PersonelFormModalProps) {
  const [form] = Form.useForm<AkademikPersonelFormValues>()
  const { message } = App.useApp()
  const save = useSaveAkademikPersonel()

  const handleFinish = async (values: AkademikPersonelFormValues) => {
    const cleaned = {
      ad: values.ad.trim().replace(/\s+/g, ' '),
      unvan: values.unvan.trim(),
      email: values.email?.trim() || null,
    }
    try {
      const result = await save.mutateAsync({ personel: personel ?? undefined, values: cleaned })
      if (personel) {
        message.success('Akademik personel güncellendi.')
      } else {
        onCreated(cleaned.ad, result.data, result.message)
      }
      onClose()
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title={personel ? 'Personeli düzenle' : 'Yeni akademik personel'}
      open={personel !== undefined}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Kaydet"
      cancelText="Vazgeç"
      confirmLoading={save.isPending}
      destroyOnHidden
    >
      {!personel && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title="Personel için otomatik olarak bir kullanıcı hesabı ve geçici parola oluşturulur."
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        preserve={false}
        initialValues={{ ad: personel?.ad ?? '', unvan: personel?.unvan ?? '' }}
      >
        <Form.Item label="Unvan" name="unvan" rules={[{ required: true, whitespace: true, message: 'Unvanı girin.' }]}>
          <AutoComplete
            options={UNVANLAR.map((value) => ({ value }))}
            placeholder="ör. Dr. Öğr. Üyesi"
            filterOption={(input, option) => matchesSearch(input, option?.value as string)}
          />
        </Form.Item>
        <Form.Item
          label="Ad Soyad"
          name="ad"
          rules={[
            { required: true, whitespace: true, message: 'Ad soyad girin.' },
            {
              validator: async (_, value: string) => {
                if (value && value.trim().split(/\s+/).length < 2) throw new Error('Ad ve soyadı birlikte girin.')
              },
            },
          ]}
        >
          <Input autoFocus={!!personel} placeholder="ör. Ayşe Yılmaz" />
        </Form.Item>
        {!personel && (
          <Form.Item
            label="Kurumsal e-posta"
            name="email"
            rules={[{ type: 'email', message: 'Geçerli bir e-posta girin.' }]}
            extra="Verilirse kullanıcı adı e-postanın @ öncesi olur (ör. ayse.yilmaz). Boşsa ad soyadın baş harfleri + 4 rakam."
          >
            <Input placeholder="ayse.yilmaz@duzce.edu.tr" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
