import { Button, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { brand } from '../theme'
import { useTour } from './tourContext'

/** Sayfa başlığının yanındaki "?" düğmesi: bulunulan sayfanın turunu başlatır */
export default function TourButton() {
  const tour = useTour()
  const pageTour = tour?.pageTour
  if (!tour || !pageTour) return null
  return (
    <Tooltip title="Bu sayfayı tanıt">
      <Button
        type="text"
        shape="circle"
        icon={<QuestionCircleOutlined style={{ fontSize: 18, color: brand.turquoise }} />}
        aria-label="Bu sayfanın turunu başlat"
        data-tour="page-help"
        onClick={() => tour.start(pageTour.id)}
      />
    </Tooltip>
  )
}
