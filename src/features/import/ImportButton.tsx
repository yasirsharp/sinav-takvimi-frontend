import { useState } from 'react'
import { Button } from 'antd'
import { FileExcelOutlined } from '@ant-design/icons'
import ImportWizard from './ImportWizard'
import type { ImportDefinition } from './importTypes'

/** Sayfa başlığındaki "Excel'den aktar" düğmesi ve içe aktarma sihirbazı */
export default function ImportButton<T>({ definition }: { definition: ImportDefinition<T> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button icon={<FileExcelOutlined />} onClick={() => setOpen(true)} data-tour="import">
        Excel'den aktar
      </Button>
      <ImportWizard open={open} onClose={() => setOpen(false)} definition={definition} />
    </>
  )
}
