import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <Result
      status="403"
      title="Yetkiniz yok"
      subTitle="Bu sayfayı görüntülemek için gerekli role sahip değilsiniz."
      extra={<Button type="primary" onClick={() => navigate('/')}>Ana sayfaya dön</Button>}
    />
  )
}
