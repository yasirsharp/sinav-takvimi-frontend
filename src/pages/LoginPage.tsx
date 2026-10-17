import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/useAuth'
import { brand, currentYear } from '../theme'
import logoUrl from '../assets/duzce-logo.png'
import { getErrorMessage } from '../api/errors'

interface LoginFormValues {
  identifier: string
  password: string
}

export default function LoginPage() {
  const { user, login, sessionEndReason } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (user) {
    return <Navigate to={from} replace />
  }

  const handleFinish = async ({ identifier, password }: LoginFormValues) => {
    setError(null)
    setSubmitting(true)
    try {
      await login(identifier, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* duzce.edu.tr üst bandı */}
      <div style={{ maxWidth: 1440, width: '100%', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
        <div style={{ height: 36, background: brand.gradient, borderRadius: '0 0 28px 28px' }} />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          gap: 28,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '100%' }}>
          <img src={logoUrl} alt="Düzce Üniversitesi" style={{ width: 420, maxWidth: '100%', height: 'auto' }} />
          <span style={{ color: brand.muted, fontStyle: 'italic', fontSize: 16, marginTop: 6 }}>
            Çevre ve Sağlık Alanında İhtisas Üniversitesi
          </span>
        </div>

        <Card
          style={{ width: '100%', maxWidth: 420, borderTop: `6px solid ${brand.navy}` }}
          styles={{ body: { padding: 28 } }}
        >
          <Typography.Title
            level={4}
            style={{ textAlign: 'center', color: brand.navy, textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: 0 }}
          >
            Sınav Takvimi Sistemi
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
            Üniversite hesabınızla giriş yapın
          </Typography.Paragraph>

          {error && <Alert type="error" title={error} showIcon style={{ marginBottom: 16 }} role="alert" />}
          {!error && sessionEndReason === 'expired' && (
            <Alert
              type="warning"
              title="Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın."
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form<LoginFormValues> layout="vertical" onFinish={handleFinish} requiredMark={false} disabled={submitting}>
            <Form.Item
              label="E-posta veya kullanıcı adı"
              name="identifier"
              rules={[{ required: true, whitespace: true, message: 'E-posta veya kullanıcı adınızı girin.' }]}
            >
              <Input prefix={<UserOutlined />} autoComplete="username" autoFocus size="large" />
            </Form.Item>

            <Form.Item label="Parola" name="password" rules={[{ required: true, message: 'Parolanızı girin.' }]}>
              <Input.Password prefix={<LockOutlined />} autoComplete="current-password" size="large" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block size="large" shape="round" loading={submitting}>
              Giriş yap
            </Button>
          </Form>
        </Card>
      </div>

      <div style={{ background: brand.navy, color: 'rgba(255,255,255,0.85)', textAlign: 'center', padding: '14px 16px' }}>
        © {currentYear} Düzce Üniversitesi
      </div>
    </div>
  )
}
