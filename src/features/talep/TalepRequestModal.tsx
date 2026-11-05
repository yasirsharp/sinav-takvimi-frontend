import { App, DatePicker, Form, Input, Modal, TimePicker, Typography } from 'antd'
import type { Dayjs } from 'dayjs'
import type { SinavDetay } from '../../api/sinav'
import { useErrorToast } from '../../bugReport/useErrorToast'
import { useResetFormOnOpen } from '../../hooks/useResetFormOnOpen'
import { useCreateTalep } from './queries'

interface FormValues {
  neden: string
  onerilenTarih?: Dayjs | null
  onerilenSaat?: [Dayjs, Dayjs] | null
}

/** Akademik personel: dersini verdiği veya gözetmen olduğu sınav için değişiklik ister */
export default function TalepRequestModal({ sinav, onClose }: { sinav: SinavDetay | null; onClose: () => void }) {
  const [form] = Form.useForm<FormValues>()
  useResetFormOnOpen(form, !!sinav, sinav?.id)
  const { message } = App.useApp()
  const showError = useErrorToast()
  const create = useCreateTalep()

  const submit = async (values: FormValues) => {
    if (!sinav) return
    try {
      await create.mutateAsync({
        sinavDetayId: sinav.id,
        neden: values.neden.trim(),
        onerilenTarih: values.onerilenTarih ? values.onerilenTarih.format('YYYY-MM-DD') : null,
        onerilenBaslangic: values.onerilenSaat?.[0]?.format('HH:mm') ?? null,
        onerilenBitis: values.onerilenSaat?.[1]?.format('HH:mm') ?? null,
      })
      message.success('Talebiniz bölüm görevlisine iletildi. Yanıt gelince bildirim alacaksınız.')
      onClose()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Modal
      title="Değişiklik iste"
      open={!!sinav}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Gönder"
      cancelText="Vazgeç"
      confirmLoading={create.isPending}
      destroyOnHidden
    >
      {sinav && (
        <Typography.Paragraph type="secondary">
          {sinav.dersAd} · {sinav.bolumAd}. Talebiniz bölümün görevlisine gider; sınavı o değiştirir.
        </Typography.Paragraph>
      )}
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <Form.Item
          name="neden"
          label="Ne değişmeli, neden?"
          rules={[
            { required: true, whitespace: true, message: 'Kısaca nedenini yazın.' },
            { min: 5, message: 'Biraz daha açıklayın (en az 5 karakter).' },
          ]}
        >
          <Input.TextArea rows={4} maxLength={1000} showCount placeholder="Ör. Aynı saatte başka kampüste dersim var; öğleden sonraya alınabilir mi?" />
        </Form.Item>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          İsterseniz uygun olduğunuz zamanı önerin:
        </Typography.Text>
        <Form.Item name="onerilenTarih" label="Önerilen gün" style={{ marginTop: 8 }}>
          <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="onerilenSaat" label="Önerilen saat">
          <TimePicker.RangePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
