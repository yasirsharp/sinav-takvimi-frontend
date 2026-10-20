import { useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import trLocale from '@fullcalendar/core/locales/tr'
import type { DateSelectArg, DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core'
import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Alert,
  App,
  AutoComplete,
  Button,
  Card,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Spin,
  Switch,
  Table,
  Tag,
  TimePicker,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { akademikPersonelApi } from '../../api/akademikPersonel'
import { TekrarTipi, type Musaitlik, type MusaitlikValues, type TekrarTipiValue } from '../../api/musaitlik'
import { getErrorMessage } from '../../api/errors'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../auth/useAuth'
import { useCan } from '../../hooks/usePermission'
import { Planlayici } from '../../auth/roles'
import { compareTr, matchesSearch } from '../../utils/search'
import { useAkademikPersoneller } from '../akademikPersonel/queries'
import { describeHours, describeRecurrence, expandMusaitlik } from './musaitlikUtils'
import { useDeleteMusaitlik, useMusaitlikler, useSaveMusaitlik } from './queries'
import '../sinav/calendar.css'
import { useResetFormOnOpen } from '../../hooks/useResetFormOnOpen'

const NEDENLER = ['Ders', 'Toplantı', 'Yıllık izin', 'Sağlık raporu', 'Görevlendirme', 'Kongre / seminer']

const COLORS = {
  mesgul: { bg: '#fdecea', border: '#e5534b', text: '#a8231b' },
  musait: { bg: '#e6f6ec', border: '#2f9e57', text: '#1d6b3a' },
}

interface FormValues {
  tarihler: [Dayjs, Dayjs | null]
  tumGun: boolean
  saatler?: [Dayjs, Dayjs]
  tekrarTipi: TekrarTipiValue
  isMusait: boolean
  neden?: string
  aciklama?: string
}

/** "09:30:00" → bugünün 09:30'u (TimePicker için) */
const timeOf = (saat: string) => dayjs(`${dayjs().format('YYYY-MM-DD')}T${saat}`)

interface FormDefaults {
  start: Dayjs
  end?: Dayjs
  allDay: boolean
}

export default function MusaitlikPage() {
  const { user } = useAuth()
  const isPlanlayici = useCan(Planlayici)
  const { data: personeller } = useAkademikPersoneller()
  const ownPersonel = useQuery({
    queryKey: ['akademikPersonel', 'byUser', user?.id],
    queryFn: () => akademikPersonelApi.getByUserId(user!.id),
    enabled: !!user,
    retry: false,
  })
  const [selectedPersonelId, setSelectedPersonelId] = useState<number | null>(null)
  const personelId = selectedPersonelId ?? ownPersonel.data?.id ?? null

  const [view, setView] = useState<'takvim' | 'liste'>('takvim')
  const [range, setRange] = useState<{ start: Dayjs; end: Dayjs } | null>(null)
  const [editing, setEditing] = useState<Musaitlik | null | undefined>(undefined)
  const [defaults, setDefaults] = useState<FormDefaults | undefined>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])

  const { data: kayitlar, isLoading, error } = useMusaitlikler(personelId)
  const remove = useDeleteMusaitlik()
  const { message } = App.useApp()

  const canEdit = isPlanlayici || (ownPersonel.data != null && personelId === ownPersonel.data.id)
  const personel = personeller?.find((p) => p.id === personelId) ?? ownPersonel.data

  const events = useMemo<EventInput[]>(() => {
    if (!range || !kayitlar) return []
    return expandMusaitlik(kayitlar, range.start, range.end).map((o, i) => {
      const c = o.record.isMusait ? COLORS.musait : COLORS.mesgul
      const title = o.record.neden || (o.record.isMusait ? 'Müsait' : 'Müsait değil')
      return {
        id: `${o.record.id}-${i}`,
        title,
        start: o.allDay ? o.date : `${o.date}T${o.start}`,
        end: o.allDay ? undefined : `${o.date}T${o.end}`,
        allDay: o.allDay,
        backgroundColor: c.bg,
        borderColor: c.border,
        textColor: c.text,
        extendedProps: { record: o.record },
      }
    })
  }, [kayitlar, range])

  const openNew = (d?: FormDefaults) => {
    setDefaults(d)
    setEditing(null)
  }

  const handleDelete = async (ids: number[]) => {
    try {
      await remove.mutateAsync(ids)
      message.success(ids.length > 1 ? `${ids.length} kayıt silindi.` : 'Kayıt silindi.')
      setSelectedRowKeys([])
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  const columns: ColumnsType<Musaitlik> = [
    {
      title: 'Ne zaman',
      key: 'when',
      sorter: (a, b) => dayjs(a.baslangicTarihi).valueOf() - dayjs(b.baslangicTarihi).valueOf(),
      defaultSortOrder: 'descend',
      render: (_, r) => describeRecurrence(r),
    },
    { title: 'Saat', key: 'hours', render: (_, r) => describeHours(r) },
    {
      title: 'Durum',
      dataIndex: 'isMusait',
      render: (musait: boolean) => (musait ? <Tag color="green">Müsait</Tag> : <Tag color="red">Müsait değil</Tag>),
    },
    {
      title: 'Neden',
      key: 'neden',
      render: (_, r) => (
        <Flex vertical>
          <span>{r.neden || '-'}</span>
          {r.aciklama && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {r.aciklama}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    ...(canEdit
      ? [
          {
            title: 'İşlemler',
            key: 'actions',
            width: 110,
            align: 'right' as const,
            render: (_: unknown, r: Musaitlik) => (
              <>
                <Button type="text" icon={<EditOutlined />} aria-label={`${describeRecurrence(r)} düzenle`} onClick={() => setEditing(r)} />
                <Popconfirm title="Kayıt silinsin mi?" okText="Sil" okButtonProps={{ danger: true }} cancelText="Vazgeç" onConfirm={() => handleDelete([r.id])}>
                  <Button type="text" danger icon={<DeleteOutlined />} aria-label={`${describeRecurrence(r)} sil`} />
                </Popconfirm>
              </>
            ),
          },
        ]
      : []),
  ]

  const personelOptions = useMemo(
    () =>
      [...(personeller ?? [])]
        .sort((a, b) => compareTr(a.ad, b.ad))
        .map((p) => ({ value: p.id, label: `${p.unvan} ${p.ad}` })),
    [personeller],
  )

  const noRecord = !isPlanlayici && ownPersonel.isError
  return (
    <>
      <PageHeader
        title="Müsaitlik"
        description="Sınav görevi verilmemesi gereken zamanları işaretleyin. Bu saatlerde gözetmen olarak seçilemezsiniz."
        actions={
          canEdit && personelId != null && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openNew()}>
              Yeni kayıt
            </Button>
          )
        }
      />

      {noRecord ? (
        <Card>
          <Empty description="Hesabınıza bağlı bir akademik personel kaydı yok. Müsaitlik girmek için yöneticinize başvurun." />
        </Card>
      ) : (
        <Card>
          <Flex gap={12} wrap align="center" style={{ marginBottom: 16 }}>
            {isPlanlayici && (
              <Select<number>
                showSearch
                placeholder="Personel seçin"
                value={personelId ?? undefined}
                onChange={setSelectedPersonelId}
                options={personelOptions}
                filterOption={(input, option) => matchesSearch(input, option?.label as string)}
                style={{ width: 320, maxWidth: '100%' }}
                aria-label="Personel"
              />
            )}
            {!isPlanlayici && personel && <Typography.Text strong>{`${personel.unvan} ${personel.ad}`}</Typography.Text>}
            <Segmented
              value={view}
              onChange={(v) => setView(v as 'takvim' | 'liste')}
              options={[
                { value: 'takvim', label: 'Takvim' },
                { value: 'liste', label: 'Liste' },
              ]}
            />
            <Flex gap={8} style={{ marginLeft: 'auto' }}>
              <Tag color="red">Müsait değil</Tag>
              <Tag color="green">Müsait (tercih)</Tag>
            </Flex>
          </Flex>

          {error && <Alert type="error" showIcon title={getErrorMessage(error)} style={{ marginBottom: 16 }} />}

          {personelId == null ? (
            ownPersonel.isLoading ? <Spin /> : <Empty description="Müsaitliğini görmek istediğiniz personeli seçin." />
          ) : view === 'takvim' ? (
            <div className="du-calendar">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                locale={trLocale}
                initialView="dayGridMonth"
                headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }}
                buttonText={{ today: 'Bugün', week: 'Hafta', month: 'Ay' }}
                firstDay={1}
                slotMinTime="08:00:00"
                slotMaxTime="22:00:00"
                height="auto"
                events={events}
                datesSet={(arg: DatesSetArg) => setRange({ start: dayjs(arg.start), end: dayjs(arg.end) })}
                selectable={canEdit}
                select={(arg: DateSelectArg) => {
                  arg.view.calendar.unselect()
                  openNew({
                    start: dayjs(arg.start),
                    // Ay görünümünde bitiş, seçilen son günün ertesi günüdür
                    end: arg.allDay ? dayjs(arg.end).subtract(1, 'day') : dayjs(arg.end),
                    allDay: arg.allDay,
                  })
                }}
                eventClick={(arg: EventClickArg) => canEdit && setEditing(arg.event.extendedProps.record as Musaitlik)}
                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              />
              {isLoading && <Spin style={{ display: 'block', marginTop: 12 }} />}
            </div>
          ) : (
            <>
              {canEdit && selectedRowKeys.length > 0 && (
                <Popconfirm
                  title={`${selectedRowKeys.length} kayıt silinsin mi?`}
                  okText="Sil"
                  okButtonProps={{ danger: true }}
                  cancelText="Vazgeç"
                  onConfirm={() => handleDelete(selectedRowKeys)}
                >
                  <Button danger icon={<DeleteOutlined />} style={{ marginBottom: 12 }}>
                    Seçilenleri sil ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
              <Table<Musaitlik>
                rowKey="id"
                columns={columns}
                dataSource={kayitlar ?? []}
                loading={isLoading}
                pagination={false}
                rowSelection={canEdit ? { selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys as number[]) } : undefined}
                locale={{ emptyText: 'Kayıt yok. Takvimde gün veya saat seçerek ekleyebilirsiniz.' }}
                scroll={{ x: 'max-content' }}
              />
            </>
          )}
        </Card>
      )}

      {personelId != null && (
        <MusaitlikFormModal
          personelId={personelId}
          kayit={editing}
          defaults={defaults}
          onClose={() => {
            setEditing(undefined)
            setDefaults(undefined)
          }}
          onDelete={(id) => handleDelete([id])}
        />
      )}
    </>
  )
}

interface MusaitlikFormModalProps {
  personelId: number
  kayit: Musaitlik | null | undefined
  defaults?: FormDefaults
  onClose: () => void
  onDelete: (id: number) => Promise<void>
}

function MusaitlikFormModal({ personelId, kayit, defaults, onClose, onDelete }: MusaitlikFormModalProps) {
  const [form] = Form.useForm<FormValues>()
  useResetFormOnOpen(form, kayit !== undefined, kayit?.id ?? defaults)
  const { message } = App.useApp()
  const save = useSaveMusaitlik()
  const tumGun = Form.useWatch('tumGun', form)
  const tekrarTipi = Form.useWatch('tekrarTipi', form)

  const initialValues: Partial<FormValues> = kayit
    ? {
        tarihler: [dayjs(kayit.baslangicTarihi), kayit.bitisTarihi ? dayjs(kayit.bitisTarihi) : null],
        tumGun: !kayit.baslangicSaati || !kayit.bitisSaati,
        saatler:
          kayit.baslangicSaati && kayit.bitisSaati
            ? [timeOf(kayit.baslangicSaati), timeOf(kayit.bitisSaati)]
            : undefined,
        tekrarTipi: kayit.tekrarTipi,
        isMusait: kayit.isMusait,
        neden: kayit.neden ?? undefined,
        aciklama: kayit.aciklama ?? undefined,
      }
    : {
        tarihler: [defaults?.start ?? dayjs(), defaults?.end && !defaults.end.isSame(defaults.start, 'day') ? defaults.end : null],
        tumGun: defaults ? defaults.allDay : true,
        saatler: defaults && !defaults.allDay ? [defaults.start, defaults.end ?? defaults.start.add(1, 'hour')] : undefined,
        tekrarTipi: TekrarTipi.Tekil,
        isMusait: false,
      }

  const handleFinish = async (values: FormValues) => {
    const [bas, bit] = values.tarihler
    const payload: MusaitlikValues = {
      akademikPersonelId: personelId,
      baslangicTarihi: bas.format('YYYY-MM-DD'),
      bitisTarihi: bit ? bit.format('YYYY-MM-DD') : null,
      baslangicSaati: values.tumGun || !values.saatler ? null : values.saatler[0].format('HH:mm:00'),
      bitisSaati: values.tumGun || !values.saatler ? null : values.saatler[1].format('HH:mm:00'),
      tekrarTipi: values.tekrarTipi,
      isMusait: values.isMusait,
      neden: values.neden?.trim() || null,
      aciklama: values.aciklama?.trim() || null,
    }
    try {
      await save.mutateAsync({ id: kayit?.id, values: payload })
      message.success(kayit ? 'Kayıt güncellendi.' : 'Kayıt eklendi.')
      onClose()
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title={kayit ? 'Müsaitlik kaydını düzenle' : 'Yeni müsaitlik kaydı'}
      open={kayit !== undefined}
      onCancel={onClose}
      destroyOnHidden
      footer={
        <Flex justify="space-between">
          <div>
            {kayit && (
              <Popconfirm
                title="Kayıt silinsin mi?"
                okText="Sil"
                okButtonProps={{ danger: true }}
                cancelText="Vazgeç"
                onConfirm={async () => {
                  await onDelete(kayit.id)
                  onClose()
                }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Sil
                </Button>
              </Popconfirm>
            )}
          </div>
          <Flex gap={8}>
            <Button onClick={onClose}>Vazgeç</Button>
            <Button type="primary" loading={save.isPending} onClick={() => form.submit()}>
              Kaydet
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Form<FormValues> form={form} layout="vertical" onFinish={handleFinish} preserve={false} initialValues={initialValues}>
        <Form.Item label="Durum" name="isMusait">
          <Segmented
            options={[
              { value: false, label: 'Müsait değilim' },
              { value: true, label: 'Müsaitim (tercih)' },
            ]}
          />
        </Form.Item>
        <Form.Item label="Tekrar" name="tekrarTipi">
          <Segmented
            options={[
              { value: TekrarTipi.Tekil, label: 'Tek sefer' },
              { value: TekrarTipi.Haftalik, label: 'Her hafta' },
              { value: TekrarTipi.Aylik, label: 'Her ay' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label={tekrarTipi === TekrarTipi.Tekil ? 'Tarih (birden çok gün için aralık seçin)' : 'Başlangıç ve bitiş (bitiş boşsa süresiz)'}
          name="tarihler"
          rules={[{ validator: (_, v?: [Dayjs, Dayjs | null]) => (v?.[0] ? Promise.resolve() : Promise.reject(new Error('Başlangıç tarihi seçin.'))) }]}
          extra={
            tekrarTipi === TekrarTipi.Haftalik
              ? 'Başlangıç gününün haftanın günü tekrarlanır (ör. Pazartesi başlarsa her Pazartesi).'
              : tekrarTipi === TekrarTipi.Aylik
                ? "Başlangıç gününün ayın günü tekrarlanır (31'i olmayan aylarda ayın son günü)."
                : undefined
          }
        >
          <DatePicker.RangePicker
            format="DD.MM.YYYY"
            allowEmpty={[false, true]}
            placeholder={['Başlangıç', tekrarTipi === TekrarTipi.Tekil ? 'Bitiş (tek gün ise boş)' : 'Bitiş (boşsa süresiz)']}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="Tüm gün" name="tumGun" valuePropName="checked">
          <Switch />
        </Form.Item>
        {!tumGun && (
          <Form.Item
            label="Saat aralığı"
            name="saatler"
            rules={[
              { required: true, message: 'Saat aralığı seçin.' },
              {
                validator: (_, v?: [Dayjs, Dayjs]) =>
                  !v || v[1].isAfter(v[0]) ? Promise.resolve() : Promise.reject(new Error('Bitiş saati başlangıçtan sonra olmalı.')),
              },
            ]}
          >
            <TimePicker.RangePicker format="HH:mm" minuteStep={15} needConfirm={false} placeholder={['Başlangıç saati', 'Bitiş saati']} style={{ width: '100%' }} />
          </Form.Item>
        )}
        <Form.Item label="Neden" name="neden" rules={[{ max: 100, message: 'En fazla 100 karakter.' }]}>
          <AutoComplete options={NEDENLER.map((value) => ({ value }))} placeholder="ör. Toplantı" allowClear />
        </Form.Item>
        <Form.Item label="Açıklama" name="aciklama" rules={[{ max: 500, message: 'En fazla 500 karakter.' }]}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
