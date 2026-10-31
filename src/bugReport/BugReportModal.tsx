import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { App, Collapse, Flex, Form, Input, Modal, Result, Switch, Typography } from 'antd'
import { bugReportApi } from '../api/bugReport'
import { getErrorMessage } from '../api/errors'
import { useAuth } from '../auth/useAuth'
import { appBuildDate, appVersionLabel, buildFeedbackMailto, feedbackEmail } from '../utils/appInfo'
import { getLogEntries } from './clientLog'
import { BUG_SHORTCUT_LABEL } from './shortcut'
import type { Screenshot } from './capture'

interface BugReportModalProps {
  open: boolean
  screenshot: Screenshot | null
  onClose: () => void
}

/** Hata bildirimi penceresi: ekran görüntüsü önizlemesi, açıklama ve otomatik eklenen bilgiler */
export default function BugReportModal({ open, screenshot, onClose }: BugReportModalProps) {
  const { user } = useAuth()
  const location = useLocation()
  const { message } = App.useApp()
  const [form] = Form.useForm<{ description: string }>()
  const [withScreenshot, setWithScreenshot] = useState(true)
  const [sending, setSending] = useState(false)
  const [sentId, setSentId] = useState<number | null>(null)

  const previewUrl = screenshot?.dataUrl ?? null

  // Pencere her açılışta yeniden kurulur (key); günlük o an okunur
  const [log] = useState(getLogEntries)

  const pageUrl = window.location.origin + location.pathname
  const viewport = `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio || 1}x`
  const version = `${appVersionLabel} ${appBuildDate}`.trim()

  const submit = async ({ description }: { description: string }) => {
    setSending(true)
    try {
      const id = await bugReportApi.create({
        description: description.trim(),
        pageUrl,
        appVersion: version,
        viewport,
        clientLog: JSON.stringify(log),
        screenshot: withScreenshot ? (screenshot?.blob ?? null) : null,
      })
      setSentId(id)
    } catch (err) {
      message.error(getErrorMessage(err), 6)
    } finally {
      setSending(false)
    }
  }

  const mailto =
    feedbackEmail && user
      ? buildFeedbackMailto(feedbackEmail, {
          url: pageUrl,
          userAgent: navigator.userAgent,
          roles: user.roles,
          userName: user.email,
        })
      : null

  return (
    <Modal
      title="Hata bildir"
      open={open}
      onCancel={onClose}
      width={640}
      okText={sentId ? 'Kapat' : 'Gönder'}
      cancelText="Vazgeç"
      cancelButtonProps={{ style: sentId ? { display: 'none' } : undefined }}
      onOk={() => (sentId ? onClose() : form.submit())}
      confirmLoading={sending}
      destroyOnHidden
      // Pencerenin kendisi sonraki ekran görüntülerine girmesin
      wrapProps={{ 'data-bug-report-ignore': '' }}
    >
      {sentId ? (
        <Result
          status="success"
          title={`Teşekkürler, bildiriminiz alındı (No: ${sentId})`}
          subTitle="Ekip inceleyip düzeltecek. Aynı sorunu tekrar yaşarsanız bu numarayı belirtebilirsiniz."
        />
      ) : (
        <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item
            name="description"
            label="Ne yapıyordunuz, ne oldu?"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Kısaca ne olduğunu yazın.',
              },
            ]}
          >
            <Input.TextArea
              autoFocus
              rows={3}
              maxLength={2000}
              showCount
              placeholder="Ör. Sınav takviminde sınavı perşembeye sürükledim, eski yerine döndü ve hata mesajı çıktı."
            />
          </Form.Item>

          <Flex vertical gap={8} style={{ marginBottom: 16 }}>
            <Flex align="center" gap={8}>
              <Switch
                checked={withScreenshot && !!screenshot}
                disabled={!screenshot}
                onChange={setWithScreenshot}
                aria-label="Ekran görüntüsünü ekle"
              />
              <Typography.Text>
                {screenshot ? 'Ekran görüntüsünü ekle' : 'Ekran görüntüsü alınamadı; bildirim görüntüsüz gönderilecek.'}
              </Typography.Text>
            </Flex>
            {previewUrl && withScreenshot && (
              <img
                src={previewUrl}
                alt="Gönderilecek ekran görüntüsü"
                style={{
                  width: '100%',
                  maxHeight: 220,
                  objectFit: 'contain',
                  border: '1px solid #e5e5e5',
                  borderRadius: 6,
                }}
              />
            )}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Görüntüde kişisel bilgi varsa ekini kapatabilirsiniz. Parola alanları görüntüye hiç girmez.
            </Typography.Text>
          </Flex>

          <Collapse
            size="small"
            items={[
              {
                key: 'info',
                label: 'Otomatik eklenecek bilgiler',
                children: (
                  <Flex vertical gap={2} style={{ fontSize: 12 }}>
                    <Typography.Text style={{ fontSize: 12 }}>Sayfa: {pageUrl}</Typography.Text>
                    <Typography.Text style={{ fontSize: 12 }}>Sürüm: {version}</Typography.Text>
                    <Typography.Text style={{ fontSize: 12 }}>
                      Kullanıcı: {user?.name || user?.email} ({user?.roles.join(', ') || '-'})
                    </Typography.Text>
                    <Typography.Text style={{ fontSize: 12 }}>Ekran: {viewport} · Tarayıcı bilgisi</Typography.Text>
                    <Typography.Text style={{ fontSize: 12 }}>Son hata kayıtları: {log.length}</Typography.Text>
                    {log.slice(-5).map((e, i) => (
                      <Typography.Text key={i} type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                        {e.kind}: {e.message}
                      </Typography.Text>
                    ))}
                  </Flex>
                ),
              },
            ]}
          />

          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
            İpucu: bu pencereyi her yerde <Typography.Text keyboard>{BUG_SHORTCUT_LABEL}</Typography.Text> ile veya telefonu sallayarak açabilirsiniz.
            {mailto && (
              <>
                {' '}
                Gönderemiyorsanız <a href={mailto}>e-postayla bildirin</a>.
              </>
            )}
          </Typography.Paragraph>
        </Form>
      )}
    </Modal>
  )
}
