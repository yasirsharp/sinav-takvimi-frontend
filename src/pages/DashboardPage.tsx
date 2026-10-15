import { Card, Col, Descriptions, Row, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useAuth } from '../auth/useAuth'
import { roleLabel } from '../auth/roles'

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Hoş geldiniz, {user.name || user.email}
        </Typography.Title>
        <Typography.Text type="secondary">
          Soldaki menüden yetkinize uygun ekranlara ulaşabilirsiniz.
        </Typography.Text>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="Hesap bilgileri">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Ad Soyad">{user.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="E-posta">{user.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="Roller">
              {user.roles.length === 0 ? (
                <Tag>Rol atanmamış</Tag>
              ) : (
                user.roles.map((role) => (
                  <Tag key={role} color="blue">
                    {roleLabel(role)}
                  </Tag>
                ))
              )}
            </Descriptions.Item>
            {user.ogrenciNo && <Descriptions.Item label="Öğrenci No">{user.ogrenciNo}</Descriptions.Item>}
            {user.bolumIds.length > 0 && (
              <Descriptions.Item label="Bölüm ID">{user.bolumIds.join(', ')}</Descriptions.Item>
            )}
            <Descriptions.Item label="Oturum bitişi">
              {dayjs(user.expiresAt).format('DD MMMM YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
    </Row>
  )
}
