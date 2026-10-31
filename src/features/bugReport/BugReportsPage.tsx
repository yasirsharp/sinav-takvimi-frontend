import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { App, Button, Card, Descriptions, Drawer, Empty, Flex, Image, Input, Segmented, Select, Spin, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { BUG_REPORT_STATES, bugReportApi, type BugReportState, type BugReportSummary } from '../../api/bugReport'
import { getErrorMessage } from '../../api/errors'
import PageHeader from '../../components/PageHeader'
import TableToolbar from '../../components/TableToolbar'
import DeleteButton from '../../components/DeleteButton'
import { defaultPagination } from '../../components/tableDefaults'
import { matchesSearch } from '../../utils/search'
import type { ClientLogEntry } from '../../bugReport/clientLog'
import { BUG_SHORTCUT_LABEL } from '../../bugReport/shortcut'
import { useBugReports, useDeleteBugReport, useUpdateBugReport } from './queries'

type Filter = BugReportState | 'tum'

const pathOf = (url: string) => {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

export default function BugReportsPage() {
  const [filter, setFilter] = useState<Filter>('yeni')
  const [search, setSearch] = useState('')
  const [params, setParams] = useSearchParams()
  const selectedId = Number(params.get('id')) || null
  const { data, isLoading, error } = useBugReports(filter === 'tum' ? undefined : filter)
  const { data: all } = useBugReports()

  const rows = useMemo(() => (data ?? []).filter((r) => matchesSearch(search, r.description, r.userName, r.pageUrl, String(r.id))), [data, search])
  const selected = (all ?? []).find((r) => r.id === selectedId) ?? null
  const select = (id: number | null) => setParams(id ? { id: String(id) } : {}, { replace: true })

  const columns: ColumnsType<BugReportSummary> = [
    { title: 'No', dataIndex: 'id', width: 64 },
    {
      title: 'Tarih',
      dataIndex: 'createdDate',
      width: 140,
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    { title: 'Bildiren', dataIndex: 'userName', responsive: ['md'] },
    {
      title: 'Sayfa',
      dataIndex: 'pageUrl',
      responsive: ['lg'],
      render: (v: string) => <Typography.Text code>{pathOf(v)}</Typography.Text>,
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      render: (v: string) => (
        <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, maxWidth: 420 }}>
          {v}
        </Typography.Paragraph>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'state',
      width: 110,
      render: (s: BugReportState) => <Tag color={BUG_REPORT_STATES[s].color}>{BUG_REPORT_STATES[s].label}</Tag>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Hata bildirimleri"
        description={`Kullanıcıların ${BUG_SHORTCUT_LABEL}, telefonu sallama veya "Hata bildir" düğmesiyle gönderdiği bildirimler.`}
      />
      <Card data-tour="table">
        <TableToolbar search={search} onSearchChange={setSearch} placeholder="Açıklama, kişi veya sayfa ara…">
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'yeni', label: 'Yeni' },
              { value: 'inceleniyor', label: 'İnceleniyor' },
              { value: 'cozuldu', label: 'Çözüldü' },
              { value: 'tum', label: 'Tümü' },
            ]}
          />
        </TableToolbar>
        <Table<BugReportSummary>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isLoading}
          pagination={defaultPagination}
          onRow={(r) => ({
            onClick: () => select(r.id),
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: error ? getErrorMessage(error) : 'Bildirim yok',
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
      <BugReportDrawer report={selected} onClose={() => select(null)} />
    </>
  )
}

function BugReportDrawer({ report, onClose }: { report: BugReportSummary | null; onClose: () => void }) {
  return (
    <Drawer open={!!report} onClose={onClose} size={720} title={report ? `Hata bildirimi #${report.id}` : ''} destroyOnHidden>
      {report && <BugReportDetail key={report.id} report={report} onClose={onClose} />}
    </Drawer>
  )
}

/** Görüntü yetkili istekle alınır (img src'ye token eklenemez); data URL olarak tutulur */
function useScreenshotUrl(report: BugReportSummary) {
  const { data: url, isLoading } = useQuery({
    queryKey: ['hata-bildirimleri', 'goruntu', report.id],
    queryFn: async () => blobToDataUrl(await bugReportApi.screenshot(report.id)),
    enabled: report.hasScreenshot,
    staleTime: Infinity,
  })
  return { url: url ?? null, isLoading }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function BugReportDetail({ report, onClose }: { report: BugReportSummary; onClose: () => void }) {
  const { message } = App.useApp()
  const update = useUpdateBugReport()
  const remove = useDeleteBugReport()
  const [state, setState] = useState<BugReportState>(report.state)
  const [note, setNote] = useState(report.adminNote ?? '')
  const { url: imageUrl, isLoading: imageLoading } = useScreenshotUrl(report)

  const log = useMemo<ClientLogEntry[]>(() => {
    try {
      return report.clientLog ? (JSON.parse(report.clientLog) as ClientLogEntry[]) : []
    } catch {
      return []
    }
  }, [report])

  const save = async () => {
    try {
      await update.mutateAsync({ id: report.id, state, adminNote: note })
      message.success('Kaydedildi.')
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  return (
    <Flex vertical gap={16}>
      <Typography.Paragraph style={{ whiteSpace: 'pre-line', fontSize: 15 }}>{report.description}</Typography.Paragraph>

      {report.hasScreenshot &&
        (imageLoading ? (
          <Spin />
        ) : imageUrl ? (
          // Tıklayınca tam boy önizleme açılır
          <Image src={imageUrl} alt={`Hata bildirimi ${report.id} ekran görüntüsü`} style={{ border: '1px solid #e5e5e5', borderRadius: 6 }} />
        ) : (
          <Typography.Text type="secondary">Ekran görüntüsü yüklenemedi.</Typography.Text>
        ))}

      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label="Tarih">{dayjs(report.createdDate).format('DD MMMM YYYY HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="Bildiren">
          {report.userName} <Typography.Text type="secondary">({report.roles || 'rol yok'})</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Sayfa">
          <a href={report.pageUrl} target="_blank" rel="noreferrer">
            {pathOf(report.pageUrl)}
          </a>
        </Descriptions.Item>
        <Descriptions.Item label="Sürüm">{report.appVersion}</Descriptions.Item>
        <Descriptions.Item label="Ekran">{report.viewport}</Descriptions.Item>
        <Descriptions.Item label="Tarayıcı">
          <Typography.Text style={{ fontSize: 12 }}>{report.userAgent}</Typography.Text>
        </Descriptions.Item>
      </Descriptions>

      <div>
        <Typography.Text strong>İstemci günlüğü ({log.length})</Typography.Text>
        {log.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Kayıtlı hata yok" />
        ) : (
          <pre
            style={{
              fontSize: 11,
              background: '#f6f8fa',
              padding: 8,
              borderRadius: 6,
              maxHeight: 240,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {log.map((e) => `${dayjs(e.time).format('HH:mm:ss')} [${e.kind}] ${e.message}`).join('\n')}
          </pre>
        )}
      </div>

      <Card size="small" title="Takip">
        <Flex vertical gap={8}>
          <Select<BugReportState>
            value={state}
            onChange={setState}
            options={Object.entries(BUG_REPORT_STATES).map(([value, s]) => ({
              value: value as BugReportState,
              label: s.label,
            }))}
            style={{ width: 200 }}
            aria-label="Durum"
          />
          <Input.TextArea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Not (ör. hangi sürümde düzeltildi)"
            aria-label="Not"
          />
          <Flex justify="space-between">
            <DeleteButton
              itemName={`Hata bildirimi #${report.id}`}
              successMessage="Hata bildirimi silindi."
              onDelete={async () => {
                await remove.mutateAsync(report.id)
                onClose()
              }}
            />
            <Button type="primary" onClick={save} loading={update.isPending}>
              Kaydet
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  )
}
