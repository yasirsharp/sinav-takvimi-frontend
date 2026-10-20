import { useMemo } from 'react'
import { Alert, App, Button, DatePicker, Flex, Form, InputNumber, Modal, Select, Space, TimePicker, Typography } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import type { SinavDetay } from '../../api/sinav'
import { getErrorMessage } from '../../api/errors'
import BolumSelect from '../../components/BolumSelect'
import { compareTr, matchesSearch } from '../../utils/search'
import { useDbapList } from '../dbap/queries'
import { useDerslikler } from '../derslik/queries'
import { useAkademikPersoneller } from '../akademikPersonel/queries'
import { useMesgulPersonel, useSaveSinav, useSinavlar } from './queries'
import { findCakismalar, formatDateParam, formatTimeParam, hasGozetmen, toDateTime, type Cakisma } from './sinavUtils'

/** Yeni sınav için önceden doldurulacak değerler (takvimde aralık seçince) */
export interface SinavFormDefaults {
  start?: Date
  end?: Date
  bolumId?: number
}

interface FormValues {
  bolumId?: number
  dbapId?: number
  tarih?: Dayjs
  saat?: [Dayjs, Dayjs]
  derslikler: { derslikId?: number; gozetmenId?: number | null }[]
}

interface SinavFormModalProps {
  /** undefined: kapalı, null: yeni sınav */
  sinav: SinavDetay | null | undefined
  defaults?: SinavFormDefaults
  onClose: () => void
}

export default function SinavFormModal({ sinav, defaults, onClose }: SinavFormModalProps) {
  const open = sinav !== undefined
  return (
    <Modal
      title={sinav ? 'Sınavı düzenle' : 'Yeni sınav'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      destroyOnHidden
    >
      {open && <SinavForm sinav={sinav} defaults={defaults} onClose={onClose} />}
    </Modal>
  )
}

function SinavForm({ sinav, defaults, onClose }: { sinav: SinavDetay | null; defaults?: SinavFormDefaults; onClose: () => void }) {
  const [form] = Form.useForm<FormValues>()
  const { message } = App.useApp()
  const save = useSaveSinav()
  const { data: dbapList } = useDbapList()
  const { data: derslikler } = useDerslikler()
  const { data: personeller } = useAkademikPersoneller()

  const initialValues = useMemo<FormValues>(() => {
    if (sinav) {
      return {
        bolumId: sinav.bolumId,
        dbapId: sinav.dersBolumAkademikPersonelId,
        tarih: dayjs(sinav.sinavTarihi),
        saat: [
          dayjs(toDateTime(sinav.sinavTarihi, sinav.sinavBaslangicSaati)),
          dayjs(toDateTime(sinav.sinavTarihi, sinav.sinavBitisSaati)),
        ],
        derslikler: sinav.derslikler.map((d) => ({ derslikId: d.derslikId, gozetmenId: hasGozetmen(d.gozetmenId) ? d.gozetmenId : null })),
      }
    }
    return {
      bolumId: defaults?.bolumId,
      tarih: defaults?.start ? dayjs(defaults.start) : undefined,
      saat: defaults?.start && defaults?.end ? [dayjs(defaults.start), dayjs(defaults.end)] : undefined,
      derslikler: [{}],
    }
  }, [sinav, defaults])

  const bolumId = Form.useWatch('bolumId', form)
  const dbapId = Form.useWatch('dbapId', form)
  const tarih = Form.useWatch('tarih', form)
  const saat = Form.useWatch('saat', form)
  const watchedDerslikler = Form.useWatch('derslikler', form)
  const seciliDerslikler = useMemo(() => watchedDerslikler ?? [], [watchedDerslikler])

  const tarihParam = tarih ? formatDateParam(tarih) : undefined
  const startParam = saat?.[0] ? saat[0].format('HH:mm') : undefined
  const endParam = saat?.[1] ? saat[1].format('HH:mm') : undefined

  // Aynı gündeki sınavlar (çakışma kontrolü için) ve o saatte meşgul olduğunu bildiren personel
  const { data: gununSinavlari } = useSinavlar(tarihParam ?? null, tarihParam ?? null)
  const { data: mesgulIds } = useMesgulPersonel(tarihParam, startParam, endParam)

  const dbapPersonel = useMemo(() => new Map((dbapList ?? []).map((x) => [x.id, x.akademikPersonelId])), [dbapList])
  const derslikById = useMemo(() => new Map((derslikler ?? []).map((d) => [d.derslikId, d])), [derslikler])
  const personelById = useMemo(() => new Map((personeller ?? []).map((p) => [p.id, p])), [personeller])

  const dbapOptions = useMemo(
    () =>
      (dbapList ?? [])
        .filter((x) => !bolumId || x.bolumId === bolumId)
        .sort((a, b) => compareTr(a.dersKodu, b.dersKodu))
        .map((x) => ({ value: x.id, label: `${x.dersKodu ?? ''} ${x.dersAd} — ${x.unvan} ${x.akademikPersonelAd}`.trim() })),
    [dbapList, bolumId],
  )

  // Aktif derslikler; seçilen bölümün derslikleri ve ortak derslikler önce
  const derslikOptions = useMemo(
    () =>
      (derslikler ?? [])
        .filter((d) => d.status)
        .sort((a, b) => {
          const pa = a.ortakDerslik || a.bolumler.some((x) => x.bolumId === bolumId) ? 0 : 1
          const pb = b.ortakDerslik || b.bolumler.some((x) => x.bolumId === bolumId) ? 0 : 1
          return pa - pb || compareTr(a.derslikAd, b.derslikAd)
        })
        .map((d) => ({ value: d.derslikId, label: `${d.derslikAd} (${d.kapasite} kişi)` })),
    [derslikler, bolumId],
  )

  const cakismalar: Cakisma[] = useMemo(() => {
    if (!tarih || !saat?.[0] || !saat?.[1] || !gununSinavlari) return []
    const day = tarih.format('YYYY-MM-DD')
    return findCakismalar(
      {
        id: sinav?.id,
        start: toDateTime(day, saat[0].format('HH:mm:ss')),
        end: toDateTime(day, saat[1].format('HH:mm:ss')),
        derslikIds: seciliDerslikler.map((d) => d?.derslikId).filter((x): x is number => !!x),
        gozetmenIds: seciliDerslikler.map((d) => d?.gozetmenId).filter(hasGozetmen),
        personelId: dbapId ? dbapPersonel.get(dbapId) : undefined,
      },
      gununSinavlari,
      dbapPersonel,
    )
  }, [tarih, saat, gununSinavlari, seciliDerslikler, dbapId, dbapPersonel, sinav?.id])

  const mesgulGozetmenler = seciliDerslikler
    .map((d) => d?.gozetmenId)
    .filter((id): id is number => hasGozetmen(id) && !!mesgulIds?.includes(id))

  const toplamKapasite = seciliDerslikler.reduce((sum, d) => sum + (d?.derslikId ? derslikById.get(d.derslikId)?.kapasite ?? 0 : 0), 0)

  const gozetmenOptions = useMemo(
    () =>
      (personeller ?? [])
        .slice()
        .sort((a, b) => compareTr(a.ad, b.ad))
        .map((p) => ({
          value: p.id,
          label: `${p.unvan} ${p.ad}${mesgulIds?.includes(p.id) ? ' — müsait değil' : ''}`,
          disabled: mesgulIds?.includes(p.id),
        })),
    [personeller, mesgulIds],
  )

  const cakismaMetni = (c: Cakisma) => {
    const saatler = `${c.sinav.sinavBaslangicSaati.slice(0, 5)}–${c.sinav.sinavBitisSaati.slice(0, 5)}`
    const diger = `${c.sinav.dersAd} (${c.sinav.bolumAd}, ${saatler})`
    if (c.tur === 'derslik') return `${derslikById.get(c.kaynakId)?.derslikAd ?? 'Derslik'} bu saatte dolu: ${diger}`
    const p = personelById.get(c.kaynakId)
    const ad = p ? `${p.unvan} ${p.ad}` : 'Personel'
    return c.tur === 'gozetmen'
      ? `Gözetmen ${ad} bu saatte başka bir sınavda: ${diger}`
      : `Dersin öğretim elemanı ${ad} bu saatte başka bir sınavda: ${diger}`
  }

  const handleFinish = async (values: FormValues) => {
    const [bas, bit] = values.saat!
    try {
      await save.mutateAsync({
        id: sinav?.id,
        values: {
          dersBolumAkademikPersonelId: values.dbapId!,
          sinavTarihi: formatDateParam(values.tarih!),
          sinavBaslangicSaati: formatTimeParam(bas),
          sinavBitisSaati: formatTimeParam(bit),
          derslikler: values.derslikler.map((d) => ({ derslikId: d.derslikId!, gozetmenId: d.gozetmenId ?? null })),
        },
      })
      message.success(sinav ? 'Sınav güncellendi.' : 'Sınav eklendi.')
      onClose()
    } catch (err) {
      message.error(getErrorMessage(err), 6)
    }
  }

  return (
    <Form<FormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFinish}
      onValuesChange={(changed) => {
        if ('bolumId' in changed) form.setFieldValue('dbapId', undefined)
      }}
      requiredMark="optional"
    >
      <Flex gap={16} wrap>
        <Form.Item label="Bölüm" name="bolumId" style={{ flex: '1 1 220px' }} rules={[{ required: true, message: 'Bölüm seçin.' }]}>
          <BolumSelect />
        </Form.Item>
        <Form.Item
          label="Ders (öğretim elemanıyla)"
          name="dbapId"
          style={{ flex: '2 1 320px' }}
          rules={[{ required: true, message: 'Ders seçin.' }]}
          extra={bolumId && dbapOptions.length === 0 ? 'Bu bölümde ders ataması yok. Önce Tanımlar > Ders Atamaları ekranından atama yapın.' : undefined}
        >
          <Select
            showSearch
            disabled={!bolumId}
            placeholder={bolumId ? 'Ders seçin' : 'Önce bölüm seçin'}
            options={dbapOptions}
            filterOption={(input, option) => matchesSearch(input, option?.label as string)}
          />
        </Form.Item>
      </Flex>

      <Flex gap={16} wrap>
        <Form.Item label="Tarih" name="tarih" style={{ flex: '1 1 200px' }} rules={[{ required: true, message: 'Tarih seçin.' }]}>
          <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Saat"
          name="saat"
          style={{ flex: '1 1 260px' }}
          rules={[
            { required: true, message: 'Başlangıç ve bitiş saatini seçin.' },
            {
              validator: async (_, value?: [Dayjs, Dayjs]) => {
                if (value?.[0] && value?.[1] && !value[1].isAfter(value[0])) throw new Error('Bitiş saati başlangıçtan sonra olmalı.')
              },
            },
          ]}
        >
          <TimePicker.RangePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} placeholder={['Başlangıç', 'Bitiş']} />
        </Form.Item>
      </Flex>

      <Flex justify="space-between" align="baseline" wrap gap={8}>
        <Typography.Text strong>Derslikler ve gözetmenler</Typography.Text>
        <Typography.Link href="/musaitlik" target="_blank" style={{ fontSize: 13 }}>
          Personel müsaitlik takvimi ↗
        </Typography.Link>
      </Flex>
      <Form.List name="derslikler" rules={[{ validator: async (_, rows) => { if (!rows?.length) throw new Error('En az bir derslik ekleyin.') } }]}>
        {(fields, { add, remove }, { errors }) => (
          <div style={{ marginTop: 8 }}>
            {fields.map((field, index) => (
              <Flex key={field.key} gap={8} align="start" wrap>
                <Form.Item
                  name={[field.name, 'derslikId']}
                  style={{ flex: '1 1 240px', marginBottom: 12 }}
                  rules={[
                    { required: true, message: 'Derslik seçin.' },
                    {
                      validator: async (_, value?: number) => {
                        const ayni = seciliDerslikler.filter((d, i) => i !== index && d?.derslikId === value)
                        if (value && ayni.length) throw new Error('Bu derslik zaten eklendi.')
                      },
                    },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder="Derslik"
                    options={derslikOptions}
                    filterOption={(input, option) => matchesSearch(input, option?.label as string)}
                    aria-label={`${index + 1}. derslik`}
                  />
                </Form.Item>
                <Form.Item name={[field.name, 'gozetmenId']} style={{ flex: '1 1 240px', marginBottom: 12 }}>
                  <Select
                    showSearch
                    allowClear
                    placeholder="Gözetmen (isteğe bağlı)"
                    options={gozetmenOptions}
                    filterOption={(input, option) => matchesSearch(input, option?.label as string)}
                    aria-label={`${index + 1}. gözetmen`}
                  />
                </Form.Item>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={`${index + 1}. dersliği kaldır`}
                  disabled={fields.length === 1}
                  onClick={() => remove(field.name)}
                />
              </Flex>
            ))}
            <Form.ErrorList errors={errors} />
            <Flex justify="space-between" align="center" wrap gap={8}>
              <Button icon={<PlusOutlined />} onClick={() => add({})}>
                Derslik ekle
              </Button>
              <Space>
                <Typography.Text type="secondary">Toplam kapasite:</Typography.Text>
                <InputNumber value={toplamKapasite} readOnly variant="borderless" suffix="kişi" style={{ width: 110 }} aria-label="Toplam kapasite" />
              </Space>
            </Flex>
          </div>
        )}
      </Form.List>

      {(cakismalar.length > 0 || mesgulGozetmenler.length > 0) && (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 16 }}
          title="Çakışma var"
          description={
            <ul style={{ margin: 0, paddingInlineStart: 18 }}>
              {cakismalar.map((c, i) => (
                <li key={i}>{cakismaMetni(c)}</li>
              ))}
              {mesgulGozetmenler.map((id) => (
                <li key={`m${id}`}>
                  {personelById.get(id)?.unvan} {personelById.get(id)?.ad} bu saatte müsait olmadığını bildirmiş.
                </li>
              ))}
            </ul>
          }
        />
      )}

      <Flex justify="end" gap={8} style={{ marginTop: 20 }}>
        <Button onClick={onClose}>Vazgeç</Button>
        <Button type="primary" htmlType="submit" loading={save.isPending}>
          Kaydet
        </Button>
      </Flex>
    </Form>
  )
}
