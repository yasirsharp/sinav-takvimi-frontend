import { useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Alert, App, Button, Card, DatePicker, Flex, Form, Input, Modal, Select, Switch, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, NotificationOutlined, PlusOutlined } from '@ant-design/icons'
import {
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_TYPES,
  PRIORITIES,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementType,
} from '../../api/announcement'
import { getErrorMessage } from '../../api/errors'
import PageHeader from '../../components/PageHeader'
import TableToolbar from '../../components/TableToolbar'
import DeleteButton from '../../components/DeleteButton'
import BolumSelect from '../../components/BolumSelect'
import { defaultPagination } from '../../components/tableDefaults'
import { useCan } from '../../hooks/usePermission'
import { useAuth } from '../../auth/useAuth'
import { Yonetici } from '../../auth/roles'
import { compareTr, matchesSearch } from '../../utils/search'
import { useDeleteDuyuru, useManageDuyurular, useSaveDuyuru } from './queries'
import { announcementState } from './duyuruUtils'

interface FormValues {
  title: string
  content: string
  type: AnnouncementType
  priority: number
  targetAudience: AnnouncementAudience
  targetBolumId?: number | null
  publishDate: Dayjs
  expiryDate?: Dayjs | null
  showAsPopup: boolean
  isActive: boolean
}

const PRIORITY_COLORS = ['default', 'gold', 'red']
const DATE_FORMAT = 'DD.MM.YYYY HH:mm'
/** Backend DateTime'ı yerel saat olarak saklar */
const toApiDate = (d: Dayjs) => d.format('YYYY-MM-DDTHH:mm:ss')

export default function DuyuruPage() {
  const isYonetici = useCan(Yonetici)
  const { data, isLoading, error } = useManageDuyurular()
  const remove = useDeleteDuyuru()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Announcement | null | undefined>(undefined)

  const rows = useMemo(
    () => (data ?? []).filter((a) => matchesSearch(search, a.title, a.content)),
    [data, search],
  )

  const columns: ColumnsType<Announcement> = [
    {
      title: 'Başlık',
      dataIndex: 'title',
      sorter: (a, b) => compareTr(a.title, b.title),
      render: (title: string, a) => (
        <Flex vertical>
          <span style={{ fontWeight: 600 }}>{title}</span>
          <Typography.Text type="secondary" ellipsis style={{ maxWidth: 420, fontSize: 12 }}>
            {a.content}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Tür',
      dataIndex: 'type',
      width: 110,
      filters: Object.entries(ANNOUNCEMENT_TYPES).map(([value, t]) => ({ text: t.label, value })),
      onFilter: (value, a) => a.type === value,
      render: (type: AnnouncementType, a) => (
        <Flex gap={4} wrap>
          <Tag color={ANNOUNCEMENT_TYPES[type]?.color}>{ANNOUNCEMENT_TYPES[type]?.label ?? type}</Tag>
          {a.priority > 0 && <Tag color={PRIORITY_COLORS[a.priority]}>{PRIORITIES[a.priority]}</Tag>}
        </Flex>
      ),
    },
    {
      title: 'Hedef',
      key: 'target',
      render: (_, a) => (
        <>
          {ANNOUNCEMENT_AUDIENCES[a.targetAudience] ?? a.targetAudience}
          {a.targetBolum && <Typography.Text type="secondary"> · {a.targetBolum.ad}</Typography.Text>}
          {a.showAsPopup && (
            <Tooltip title="Girişte açılır pencerede gösterilir">
              <NotificationOutlined style={{ marginLeft: 6, color: '#166fc7' }} />
            </Tooltip>
          )}
        </>
      ),
    },
    {
      title: 'Yayın',
      dataIndex: 'publishDate',
      width: 190,
      sorter: (a, b) => dayjs(a.publishDate).valueOf() - dayjs(b.publishDate).valueOf(),
      defaultSortOrder: 'descend',
      render: (_: string, a) => {
        const state = announcementState(a)
        return (
          <Flex vertical>
            <span>
              {dayjs(a.publishDate).format(DATE_FORMAT)} <Tag color={state.color}>{state.label}</Tag>
            </span>
            {a.expiryDate && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Bitiş: {dayjs(a.expiryDate).format(DATE_FORMAT)}
              </Typography.Text>
            )}
          </Flex>
        )
      },
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, a) => (
        <>
          <Tooltip title="Düzenle">
            <Button type="text" icon={<EditOutlined />} aria-label={`${a.title} düzenle`} onClick={() => setEditing(a)} />
          </Tooltip>
          <DeleteButton itemName={a.title} successMessage="Duyuru silindi." onDelete={() => remove.mutateAsync(a.id)} />
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Duyurular"
        description={
          isYonetici
            ? 'Duyurular ana sayfada, açılır pencere seçilirse girişte gösterilir.'
            : 'Kendi bölümünüze yönelik duyurular. Duyurular ana sayfada, açılır pencere seçilirse girişte gösterilir.'
        }
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>
            Yeni duyuru
          </Button>
        }
      />
      <Card>
        <TableToolbar search={search} onSearchChange={setSearch} placeholder="Başlık veya içerik ara…" />
        <Table<Announcement>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isLoading}
          pagination={defaultPagination}
          locale={{ emptyText: error ? getErrorMessage(error) : 'Henüz duyuru yok' }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
      <DuyuruFormModal duyuru={editing} onClose={() => setEditing(undefined)} />
    </>
  )
}

function DuyuruFormModal({ duyuru, onClose }: { duyuru: Announcement | null | undefined; onClose: () => void }) {
  const [form] = Form.useForm<FormValues>()
  const { message } = App.useApp()
  const { user } = useAuth()
  const isYonetici = useCan(Yonetici)
  const save = useSaveDuyuru()

  // Bölüm görevlisi sadece kendi bölümlerine duyuru gönderebilir
  const ownBolumIds = user?.bolumIds ?? []

  const initialValues: Partial<FormValues> = duyuru
    ? {
        ...duyuru,
        publishDate: dayjs(duyuru.publishDate),
        expiryDate: duyuru.expiryDate ? dayjs(duyuru.expiryDate) : null,
      }
    : {
        type: 'general',
        priority: 0,
        targetAudience: 'all',
        targetBolumId: isYonetici ? null : ownBolumIds[0],
        publishDate: dayjs().startOf('minute'),
        expiryDate: null,
        showAsPopup: false,
        isActive: true,
      }

  const handleFinish = async (values: FormValues) => {
    try {
      await save.mutateAsync({
        id: duyuru?.id,
        values: {
          title: values.title.trim(),
          content: values.content.trim(),
          type: values.type,
          priority: values.priority,
          targetAudience: values.targetAudience,
          targetBolumId: values.targetBolumId ?? null,
          publishDate: toApiDate(values.publishDate),
          expiryDate: values.expiryDate ? toApiDate(values.expiryDate) : null,
          showAsPopup: values.showAsPopup,
          isActive: values.isActive,
        },
      })
      message.success(duyuru ? 'Duyuru güncellendi.' : 'Duyuru yayınlandı.')
      onClose()
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title={duyuru ? 'Duyuruyu düzenle' : 'Yeni duyuru'}
      open={duyuru !== undefined}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Kaydet"
      cancelText="Vazgeç"
      confirmLoading={save.isPending}
      width={640}
      destroyOnHidden
    >
      <Form<FormValues> form={form} layout="vertical" onFinish={handleFinish} preserve={false} initialValues={initialValues}>
        <Form.Item label="Başlık" name="title" rules={[{ required: true, whitespace: true, max: 200, message: 'Başlık girin (en fazla 200 karakter).' }]}>
          <Input autoFocus />
        </Form.Item>
        <Form.Item label="İçerik" name="content" rules={[{ required: true, whitespace: true, message: 'İçerik girin.' }]}>
          <Input.TextArea autoSize={{ minRows: 4, maxRows: 10 }} />
        </Form.Item>
        <Flex gap={12} wrap>
          <Form.Item label="Tür" name="type" style={{ flex: 1, minWidth: 160 }}>
            <Select options={Object.entries(ANNOUNCEMENT_TYPES).map(([value, t]) => ({ value, label: t.label }))} />
          </Form.Item>
          <Form.Item label="Öncelik" name="priority" style={{ flex: 1, minWidth: 140 }}>
            <Select options={PRIORITIES.map((label, value) => ({ value, label }))} />
          </Form.Item>
        </Flex>
        <Flex gap={12} wrap>
          <Form.Item label="Kime" name="targetAudience" style={{ flex: 1, minWidth: 160 }}>
            <Select options={Object.entries(ANNOUNCEMENT_AUDIENCES).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item
            label="Bölüm"
            name="targetBolumId"
            style={{ flex: 1, minWidth: 200 }}
            rules={isYonetici ? [] : [{ required: true, message: 'Bölümünüzü seçin.' }]}
            extra={isYonetici ? 'Boşsa tüm bölümler' : undefined}
          >
            {isYonetici ? (
              <BolumSelect placeholder="Tüm bölümler" />
            ) : (
              <BolumSelect allowClear={false} onlyIds={ownBolumIds} />
            )}
          </Form.Item>
        </Flex>
        <Flex gap={12} wrap>
          <Form.Item label="Yayın tarihi" name="publishDate" style={{ flex: 1, minWidth: 200 }} rules={[{ required: true, message: 'Yayın tarihi seçin.' }]}>
            <DatePicker showTime={{ format: 'HH:mm' }} format={DATE_FORMAT} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="Bitiş tarihi"
            name="expiryDate"
            style={{ flex: 1, minWidth: 200 }}
            dependencies={['publishDate']}
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, value: Dayjs | null) =>
                  !value || value.isAfter(getFieldValue('publishDate'))
                    ? Promise.resolve()
                    : Promise.reject(new Error('Bitiş, yayın tarihinden sonra olmalı.')),
              }),
            ]}
            extra="Boşsa süresiz"
          >
            <DatePicker showTime={{ format: 'HH:mm' }} format={DATE_FORMAT} style={{ width: '100%' }} />
          </Form.Item>
        </Flex>
        <Flex gap={24} wrap>
          <Form.Item label="Girişte açılır pencerede göster" name="showAsPopup" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Aktif" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Flex>
        {!isYonetici && ownBolumIds.length === 0 && (
          <Alert type="warning" showIcon title="Size atanmış bir bölüm yok; duyuru gönderemezsiniz." />
        )}
      </Form>
    </Modal>
  )
}
