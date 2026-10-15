import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/useAuth'
import { getErrorMessage } from '../api/errors'

interface LoginFormValues {
  identifier: string
  password: string
}

export default function LoginPage() {
  const { user, login } = useAuth()
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'linear-gradient(135deg, #e6f0ff 0%, #f5f7fa 100%)',
      }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Sınav Takvimi
          </Typography.Title>
          <Typography.Text type="secondary">Düzce Üniversitesi</Typography.Text>
        </div>

        {error && (
          <Alert type="error" title={error} showIcon style={{ marginBottom: 16 }} role="alert" />
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

          <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
            Giriş yap
          </Button>
        </Form>
      </Card>
    </div>
  )
}
