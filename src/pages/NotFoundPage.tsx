import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Result
      status="404"
      title="Sayfa bulunamadı"
      subTitle="Aradığınız sayfa mevcut değil."
      extra={<Button type="primary" onClick={() => navigate('/')}>Ana sayfaya dön</Button>}
    />
  )
}
