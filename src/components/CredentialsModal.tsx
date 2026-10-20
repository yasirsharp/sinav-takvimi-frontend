import { Alert, Descriptions, Modal, Typography } from 'antd'

export interface CredentialsInfo {
  /** Hesabın kime ait olduğu (ör. "Ayşe Yılmaz") */
  owner: string
  userName: string
  password: string
}

interface CredentialsModalProps {
  credentials: CredentialsInfo | null
  title?: string
  onClose: () => void
}

/** Yeni açılan veya parolası sıfırlanan hesabın geçici giriş bilgileri. Bilgiler bir kez gösterilir. */
export default function CredentialsModal({ credentials, title = 'Hesap oluşturuldu', onClose }: CredentialsModalProps) {
  return (
    <Modal
      title={title}
      open={!!credentials}
      onCancel={onClose}
      onOk={onClose}
      okText="Bilgileri kaydettim"
      cancelButtonProps={{ style: { display: 'none' } }}
      mask={{ closable: false }}
    >
      {credentials && (
        <>
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            title="Bu bilgiler bir daha gösterilmeyecek."
            description="Kullanıcı adını ve geçici parolayı kişiye güvenli bir yolla iletin. İlk girişte yeni parola belirlemesi istenir."
          />
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Kişi">{credentials.owner}</Descriptions.Item>
            <Descriptions.Item label="Kullanıcı adı">
              <Typography.Text copyable strong>
                {credentials.userName}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Geçici parola">
              <Typography.Text copyable code>
                {credentials.password}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
        </>
      )}
    </Modal>
  )
}
