import { Button, Dropdown, Tooltip } from 'antd'
import { LoginOutlined, MoreOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/useAuth'
import { Roles } from '../auth/roles'
import { useSwitchUser } from '../auth/useSwitchUser'

/**
 * Satırdaki "⋯" menüsü: süper yönetici bu kişi olarak sisteme girer. Kurallar sunucuda da denetlenir:
 * kendisi, pasif hesap ve başka süper yönetici seçilemez.
 */
export default function ImpersonateMenu({
  userId,
  name,
  roles,
  active = true,
}: {
  userId?: number | null
  name: string
  roles?: readonly string[]
  active?: boolean
}) {
  const { user } = useAuth()
  const { canSwitch, switchTo } = useSwitchUser()
  if (!canSwitch || !user || userId == null) return null

  const realId = user.actAsBy?.id ?? user.id
  const reason =
    userId === realId || userId === user.id
      ? 'Zaten bu hesaptasınız'
      : !active
        ? 'Pasif hesap'
        : roles?.includes(Roles.SuperAdmin)
          ? 'Süper yönetici hesabına geçilemez'
          : null

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        items: [
          {
            key: 'impersonate',
            icon: <LoginOutlined />,
            disabled: !!reason,
            label: reason ? <Tooltip title={reason}>Bu kullanıcı olarak gir</Tooltip> : 'Bu kullanıcı olarak gir',
            onClick: () => void switchTo(userId, name),
          },
        ],
      }}
    >
      <Button type="text" icon={<MoreOutlined />} aria-label={`${name} diğer işlemler`} />
    </Dropdown>
  )
}
