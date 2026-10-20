import { useMemo, useState } from 'react'
import { Alert, App, Button, Flex, Modal, Progress, Result, Steps, Table, Tag, Typography, Upload } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CheckCircleFilled, CloseCircleFilled, DownloadOutlined, FileExcelOutlined, InboxOutlined } from '@ant-design/icons'
import { getErrorMessage } from '../../api/errors'
import { downloadBlob, downloadTemplate, readSpreadsheet, rowsFromMatrix, toCsv, type ImportColumn } from './importUtils'
import { validateRows, type ImportDefinition, type ImportResult, type ValidatedRow } from './importTypes'

type Step = 'file' | 'preview' | 'result'

interface ImportWizardProps<T> {
  open: boolean
  onClose: () => void
  definition: ImportDefinition<T>
}

export default function ImportWizard<T>({ open, onClose, definition }: ImportWizardProps<T>) {
  const { message } = App.useApp()
  const [step, setStep] = useState<Step>('file')
  const [fileName, setFileName] = useState<string>('')
  const [rows, setRows] = useState<ValidatedRow<T>[]>([])
  const [missing, setMissing] = useState<ImportColumn[]>([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ImportResult[]>([])

  const validRows = useMemo(() => rows.filter((r) => r.value !== undefined), [rows])
  const invalidCount = rows.length - validRows.length

  const reset = () => {
    setStep('file')
    setRows([])
    setMissing([])
    setResults([])
    setProgress(0)
    setFileName('')
  }

  const close = () => {
    if (running) return
    reset()
    onClose()
  }

  const handleFile = async (file: File) => {
    try {
      const matrix = await readSpreadsheet(file)
      const sheet = rowsFromMatrix(matrix, definition.columns)
      setFileName(file.name)
      setMissing(sheet.missingColumns)
      setRows(validateRows(definition, sheet.rows))
      setStep('preview')
    } catch (err) {
      message.error(getErrorMessage(err))
    }
    return false // Upload bileşeni dosyayı kendisi göndermesin
  }

  const handleRun = async () => {
    setRunning(true)
    setProgress(0)
    try {
      const out = await definition.run(
        validRows.map((r) => ({ row: r.row, value: r.value as T })),
        (ratio) => setProgress(Math.round(ratio * 100)),
      )
      // Önizlemede hatalı olan satırlar da sonuç dosyasında görünsün
      const skipped: ImportResult[] = rows
        .filter((r) => r.value === undefined)
        .map((r) => ({ row: r.row, success: false, message: r.errors.join(' ') }))
      setResults([...out, ...skipped].sort((a, b) => a.row - b.row))
      setStep('result')
    } catch (err) {
      message.error(getErrorMessage(err))
    } finally {
      setRunning(false)
    }
  }

  const downloadResults = () => {
    const byRow = new Map(rows.map((r) => [r.row, r]))
    const header = ['Satır', 'Durum', 'Mesaj', ...(definition.credentials ? ['Kullanıcı adı', 'Geçici parola'] : []), ...definition.columns.map((c) => c.header)]
    const body = results.map((r) => [
      r.row,
      r.success ? 'Eklendi' : 'Hata',
      r.message,
      ...(definition.credentials ? [r.userName ?? '', r.password ?? ''] : []),
      ...definition.columns.map((c) => byRow.get(r.row)?.values[c.key] ?? ''),
    ])
    downloadBlob(new Blob([toCsv([header, ...body])], { type: 'text/csv;charset=utf-8' }), `${definition.fileName}-sonuc.csv`)
  }

  const previewColumns: ColumnsType<ValidatedRow<T>> = [
    { title: 'Satır', dataIndex: 'row', width: 64, fixed: 'left' },
    {
      title: 'Durum',
      key: 'status',
      width: 260,
      render: (_, r) =>
        r.errors.length ? (
          <Typography.Text type="danger" style={{ fontSize: 12 }}>
            <CloseCircleFilled /> {r.errors.join(' ')}
          </Typography.Text>
        ) : (
          <Typography.Text type="success">
            <CheckCircleFilled /> Hazır
          </Typography.Text>
        ),
    },
    ...definition.columns.map((c) => ({
      title: c.header,
      key: c.key,
      render: (_: unknown, r: ValidatedRow<T>) => r.values[c.key] || <Typography.Text type="secondary">—</Typography.Text>,
    })),
  ]

  const successCount = results.filter((r) => r.success).length
  const resultColumns: ColumnsType<ImportResult> = [
    { title: 'Satır', dataIndex: 'row', width: 64 },
    {
      title: 'Sonuç',
      key: 'success',
      width: 90,
      render: (_, r) => (r.success ? <Tag color="green">Eklendi</Tag> : <Tag color="red">Hata</Tag>),
    },
    { title: 'Mesaj', dataIndex: 'message' },
    ...(definition.credentials
      ? [
          { title: 'Kullanıcı adı', dataIndex: 'userName', render: (v?: string) => (v ? <Typography.Text copyable>{v}</Typography.Text> : null) },
          { title: 'Geçici parola', dataIndex: 'password', render: (v?: string) => (v ? <Typography.Text code copyable>{v}</Typography.Text> : null) },
        ]
      : []),
  ]

  return (
    <Modal
      title={`${definition.title} içe aktar`}
      open={open}
      onCancel={close}
      width={1100}
      mask={{ closable: false }}
      closable={!running}
      destroyOnHidden
      footer={
        step === 'file' ? (
          <Button onClick={close}>Kapat</Button>
        ) : step === 'preview' ? (
          <Flex justify="space-between" gap={8} wrap>
            <Button onClick={reset} disabled={running}>
              Başka dosya seç
            </Button>
            <Button type="primary" onClick={handleRun} loading={running} disabled={validRows.length === 0 || missing.length > 0}>
              {validRows.length} satırı aktar
            </Button>
          </Flex>
        ) : (
          <Flex justify="space-between" gap={8} wrap>
            <Button icon={<DownloadOutlined />} onClick={downloadResults}>
              Sonuç dosyasını indir (CSV)
            </Button>
            <Button type="primary" onClick={close}>
              Kapat
            </Button>
          </Flex>
        )
      }
    >
      <Steps
        size="small"
        current={step === 'file' ? 0 : step === 'preview' ? 1 : 2}
        items={[{ title: 'Dosya' }, { title: 'Önizleme' }, { title: 'Sonuç' }]}
        style={{ marginBottom: 20 }}
      />

      {step === 'file' && (
        <Flex vertical gap={16}>
          <Alert
            type="info"
            showIcon
            title="Şablonu indirip doldurun, sonra dosyayı buraya bırakın."
            description={
              <>
                <ul style={{ margin: '4px 0', paddingLeft: 18 }}>
                  {definition.columns.map((c) => (
                    <li key={c.key}>
                      <strong>{c.header}</strong>
                      {c.required ? ' (zorunlu)' : ' (isteğe bağlı)'}
                      {c.help ? ` — ${c.help}` : ''}
                    </li>
                  ))}
                </ul>
                {definition.notes}
              </>
            }
          />
          <Flex gap={8} wrap>
            <Button icon={<FileExcelOutlined />} onClick={() => void downloadTemplate(definition.columns, `${definition.fileName}-sablon`, 'xlsx')}>
              Excel şablonu (.xlsx)
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => void downloadTemplate(definition.columns, `${definition.fileName}-sablon`, 'csv')}>
              CSV şablonu
            </Button>
          </Flex>
          <Upload.Dragger accept=".xlsx,.csv" showUploadList={false} beforeUpload={handleFile} disabled={definition.ready === false}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Dosyayı sürükleyip bırakın veya tıklayıp seçin</p>
            <p className="ant-upload-hint">.xlsx veya .csv · ilk satır sütun başlıkları olmalı</p>
          </Upload.Dragger>
        </Flex>
      )}

      {step === 'preview' && (
        <Flex vertical gap={12}>
          <Typography.Text>
            <strong>{fileName}</strong>: {rows.length} satır · <Typography.Text type="success">{validRows.length} hazır</Typography.Text>
            {invalidCount > 0 && <Typography.Text type="danger"> · {invalidCount} hatalı (aktarılmayacak)</Typography.Text>}
          </Typography.Text>
          {missing.length > 0 && (
            <Alert
              type="error"
              showIcon
              title={`Dosyada zorunlu sütun eksik: ${missing.map((c) => c.header).join(', ')}`}
              description="Şablondaki başlıkları kullanın."
            />
          )}
          {running && <Progress percent={progress} status="active" />}
          <Table<ValidatedRow<T>>
            rowKey="row"
            size="small"
            columns={previewColumns}
            dataSource={rows}
            pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
            scroll={{ x: 'max-content', y: 420 }}
            rowClassName={(r) => (r.errors.length ? 'du-row-error' : '')}
          />
        </Flex>
      )}

      {step === 'result' && (
        <Flex vertical gap={12}>
          <Result
            status={successCount === results.length ? 'success' : successCount > 0 ? 'warning' : 'error'}
            title={`${successCount} kayıt eklendi${results.length - successCount ? `, ${results.length - successCount} satır hatalı` : ''}`}
            style={{ padding: '8px 0' }}
          />
          {definition.credentials && successCount > 0 && (
            <Alert
              type="warning"
              showIcon
              title="Sonuç dosyası geçici parolaları içerir; bu bilgiler bir daha gösterilmeyecek."
              description="Dosyayı indirip güvenli bir yerde saklayın, parolaları kişilere ilettikten sonra silin. Kullanıcılar ilk girişte parolalarını değiştirmek zorundadır."
            />
          )}
          <Table<ImportResult>
            rowKey="row"
            size="small"
            columns={resultColumns}
            dataSource={results}
            pagination={{ defaultPageSize: 20 }}
            scroll={{ x: 'max-content', y: 380 }}
          />
        </Flex>
      )}
    </Modal>
  )
}
