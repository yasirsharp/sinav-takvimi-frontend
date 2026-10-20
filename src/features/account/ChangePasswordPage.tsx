import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, App, Button, Card, Flex, Form, Input, Space, Typography } from 'antd'
import { CheckCircleFilled, CloseCircleOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../../auth/useAuth'
import { getErrorMessage } from '../../api/errors'
import { checkPassword, isStrongPassword } from '../../utils/passwordPolicy'
import { brand } from '../../theme'
import PageHeader from '../../components/PageHeader'

interface FormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const newPassword = Form.useWatch('newPassword', form) ?? ''
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const forced = user?.mustChangePassword ?? false

  const handleFinish = async (values: FormValues) => {
    setError(null)
    setSubmitting(true)
    try {
      await changePassword(values.currentPassword, values.newPassword)
      message.success('Parolanız değiştirildi.')
      form.resetFields()
      if (forced) navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="Parola değiştir" />
      <Card style={{ maxWidth: 520, borderTop: `6px solid ${brand.navy}` }}>
        {forced && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
            title="İlk girişiniz veya parolanız sıfırlandı"
            description="Devam etmek için size verilen geçici parolayı kendi belirleyeceğiniz bir parolayla değiştirin."
          />
        )}
        {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} role="alert" />}

        <Form<FormValues> form={form} layout="vertical" onFinish={handleFinish} requiredMark={false} disabled={submitting}>
          <Form.Item
            label={forced ? 'Geçici parola' : 'Mevcut parola'}
            name="currentPassword"
            rules={[{ required: true, message: 'Mevcut parolanızı girin.' }]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" autoFocus />
          </Form.Item>

          <Form.Item
            label="Yeni parola"
            name="newPassword"
            rules={[
              { required: true, message: 'Yeni parolanızı girin.' },
              {
                validator: (_, value: string | undefined) =>
                  !value || isStrongPassword(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error('Parola aşağıdaki kuralların hepsini sağlamalıdır.')),
              },
              ({ getFieldValue }) => ({
                validator: (_, value: string | undefined) =>
                  !value || value !== getFieldValue('currentPassword')
                    ? Promise.resolve()
                    : Promise.reject(new Error('Yeni parola mevcut paroladan farklı olmalıdır.')),
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
          </Form.Item>

          <Flex vertical gap={2} style={{ marginTop: -8, marginBottom: 16 }} aria-label="Parola kuralları">
            {checkPassword(newPassword).map((rule) => (
              <Typography.Text key={rule.label} type={rule.ok ? 'success' : 'secondary'} style={{ fontSize: 13 }}>
                {rule.ok ? <CheckCircleFilled /> : <CloseCircleOutlined />} {rule.label}
              </Typography.Text>
            ))}
          </Flex>

          <Form.Item
            label="Yeni parola (tekrar)"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Yeni parolanızı tekrar girin.' },
              ({ getFieldValue }) => ({
                validator: (_, value: string | undefined) =>
                  !value || value === getFieldValue('newPassword')
                    ? Promise.resolve()
                    : Promise.reject(new Error('Parolalar eşleşmiyor.')),
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
          </Form.Item>

          <Space wrap>
            <Button type="primary" htmlType="submit" shape="round" loading={submitting}>
              Parolayı değiştir
            </Button>
            {forced ? (
              <Button shape="round" onClick={logout}>
                Çıkış yap
              </Button>
            ) : (
              <Button shape="round" onClick={() => navigate(-1)}>
                Vazgeç
              </Button>
            )}
          </Space>
        </Form>
      </Card>
    </>
  )
}
