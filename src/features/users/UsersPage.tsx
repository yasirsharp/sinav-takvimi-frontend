import { useMemo, useState } from 'react'
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Popover,
  Segmented,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, KeyOutlined, QuestionCircleOutlined, SafetyOutlined } from '@ant-design/icons'
import type { UserUpdateValues, UserWithRoles } from '../../api/user'
import { getErrorMessage } from '../../api/errors'
import PageHeader from '../../components/PageHeader'
import TableToolbar from '../../components/TableToolbar'
import DeleteButton from '../../components/DeleteButton'
import CredentialsModal, { type CredentialsInfo } from '../../components/CredentialsModal'
import { defaultPagination } from '../../components/tableDefaults'
import { ROLE_COLORS, ROLE_DESCRIPTIONS, Roles, Yonetici, roleLabel } from '../../auth/roles'
import { useAuth } from '../../auth/useAuth'
import { compareTr, matchesSearch } from '../../utils/search'
import { useDeleteUser, useResetPassword, useRoleList, useToggleRole, useUpdateUser, useUserClaims, useUsers } from './queries'

type StatusFilter = 'all' | 'active' | 'passive'

const fullName = (u: UserWithRoles) => `${u.firstName} ${u.lastName}`

export default function UsersPage() {
  const { user: me } = useAuth()
  const { message } = App.useApp()
  const { data, isLoading, error } = useUsers()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const resetPassword = useResetPassword()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [editing, setEditing] = useState<UserWithRoles | null>(null)
  const [roleEditing, setRoleEditing] = useState<UserWithRoles | null>(null)
  const [credentials, setCredentials] = useState<CredentialsInfo | null>(null)

  const amSuperAdmin = me?.roles.includes(Roles.SuperAdmin) ?? false
  /** super.admin hesaplarını sadece super.admin değiştirebilir (backend de reddeder) */
  const isProtected = (u: UserWithRoles) => !amSuperAdmin && u.roles.includes(Roles.SuperAdmin)

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (u) =>
          matchesSearch(search, fullName(u), u.userName, u.email) &&
          (status === 'all' || (status === 'active') === u.status),
      ),
    [data, search, status],
  )

  const toggleStatus = async (u: UserWithRoles, active: boolean) => {
    try {
      await updateUser.mutateAsync({
        id: u.id,
        values: { firstName: u.firstName, lastName: u.lastName, email: u.email, userName: u.userName, status: active },
      })
      message.success(active ? `${fullName(u)} etkinleştirildi.` : `${fullName(u)} pasifleştirildi; giriş yapamaz.`)
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  const handleReset = async (u: UserWithRoles) => {
    try {
      const account = await resetPassword.mutateAsync(u.id)
      setCredentials({ owner: fullName(u), userName: account.userName, password: account.temporaryPassword })
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  const columns: ColumnsType<UserWithRoles> = [
    {
      title: 'Ad Soyad',
      key: 'name',
      sorter: (a, b) => compareTr(fullName(a), fullName(b)),
      defaultSortOrder: 'ascend',
      render: (_, u) => (
        <Flex vertical>
          <span>
            {fullName(u)} {u.id === me?.id && <Tag>siz</Tag>}
          </span>
          {u.mustChangePassword && (
            <Typography.Text type="warning" style={{ fontSize: 12 }}>
              İlk girişte parola değiştirecek
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    { title: 'Kullanıcı adı', dataIndex: 'userName', sorter: (a, b) => compareTr(a.userName, b.userName) },
    { title: 'E-posta', dataIndex: 'email', responsive: ['md'] },
    {
      title: 'Roller',
      dataIndex: 'roles',
      filters: Object.values(Roles).map((r) => ({ text: roleLabel(r), value: r })),
      onFilter: (value, u) => u.roles.includes(value as string),
      render: (roles: string[]) =>
        roles.length ? (
          roles.map((r) => (
            <Tag key={r} color={ROLE_COLORS[r]}>
              {roleLabel(r)}
            </Tag>
          ))
        ) : (
          <Typography.Text type="secondary">Rol yok</Typography.Text>
        ),
    },
    {
      title: 'Aktif',
      dataIndex: 'status',
      width: 80,
      render: (active: boolean, u) => (
        <Tooltip title={u.id === me?.id ? 'Kendi hesabınızı pasifleştiremezsiniz' : isProtected(u) ? 'Süper yönetici' : undefined}>
          <Switch
            size="small"
            checked={active}
            disabled={u.id === me?.id || isProtected(u)}
            aria-label={`${fullName(u)} aktif`}
            onChange={(checked) => void toggleStatus(u, checked)}
          />
        </Tooltip>
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 170,
      align: 'right',
      render: (_, u) => {
        const locked = isProtected(u)
        return (
          <>
            <Tooltip title="Düzenle">
              <Button type="text" icon={<EditOutlined />} disabled={locked} aria-label={`${fullName(u)} düzenle`} onClick={() => setEditing(u)} />
            </Tooltip>
            <Tooltip title="Roller">
              <Button type="text" icon={<SafetyOutlined />} aria-label={`${fullName(u)} roller`} onClick={() => setRoleEditing(u)} />
            </Tooltip>
            <Popconfirm
              title="Parola sıfırlansın mı?"
              description="Yeni bir geçici parola üretilir; kullanıcı ilk girişte değiştirir."
              okText="Sıfırla"
              cancelText="Vazgeç"
              disabled={locked || u.id === me?.id}
              onConfirm={() => handleReset(u)}
            >
              <Tooltip title={u.id === me?.id ? 'Kendi parolanızı "Parolamı değiştir" ile değiştirin' : 'Parola sıfırla'}>
                <Button type="text" icon={<KeyOutlined />} disabled={locked || u.id === me?.id} aria-label={`${fullName(u)} parola sıfırla`} />
              </Tooltip>
            </Popconfirm>
            {u.id !== me?.id && !locked && (
              <DeleteButton
                itemName={fullName(u)}
                successMessage="Kullanıcı silindi."
                onDelete={() => deleteUser.mutateAsync(u.id)}
              />
            )}
          </>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Kullanıcılar"
        description="Hesaplar akademik personel ve öğrenci eklenirken otomatik açılır. Burada rol, durum ve parola yönetilir."
        actions={
          <Popover
            title="Roller"
            trigger="click"
            placement="bottomRight"
            content={
              <Flex vertical gap={8} style={{ maxWidth: 360 }}>
                {Object.values(Roles).map((r) => (
                  <div key={r}>
                    <Tag color={ROLE_COLORS[r]}>{roleLabel(r)}</Tag>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      {ROLE_DESCRIPTIONS[r]}
                    </Typography.Text>
                  </div>
                ))}
              </Flex>
            }
          >
            <Button icon={<QuestionCircleOutlined />}>Roller hakkında</Button>
          </Popover>
        }
      />

      <Card>
        <TableToolbar search={search} onSearchChange={setSearch} placeholder="Ad, kullanıcı adı veya e-posta ara…">
          <Segmented<StatusFilter>
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'Tümü' },
              { value: 'active', label: 'Aktif' },
              { value: 'passive', label: 'Pasif' },
            ]}
          />
        </TableToolbar>
        <Table<UserWithRoles>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isLoading}
          pagination={defaultPagination}
          locale={{ emptyText: error ? getErrorMessage(error) : 'Kayıt bulunamadı' }}
          scroll={{ x: 'max-content' }}
          rowClassName={(u) => (u.status ? '' : 'du-row-passive')}
        />
      </Card>

      <UserEditModal user={editing} onClose={() => setEditing(null)} />
      <RoleModal user={roleEditing} amSuperAdmin={amSuperAdmin} myId={me?.id} onClose={() => setRoleEditing(null)} />
      <CredentialsModal title="Parola sıfırlandı" credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  )
}

function UserEditModal({ user, onClose }: { user: UserWithRoles | null; onClose: () => void }) {
  const [form] = Form.useForm<UserUpdateValues>()
  const { message } = App.useApp()
  const update = useUpdateUser()

  const handleFinish = async (values: UserUpdateValues) => {
    if (!user) return
    try {
      await update.mutateAsync({
        id: user.id,
        values: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          userName: values.userName.trim(),
          status: user.status,
        },
      })
      message.success('Kullanıcı güncellendi.')
      onClose()
    } catch (err) {
      message.error(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title="Kullanıcıyı düzenle"
      open={!!user}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Kaydet"
      cancelText="Vazgeç"
      confirmLoading={update.isPending}
      destroyOnHidden
    >
      {user && (
        <Form form={form} layout="vertical" onFinish={handleFinish} preserve={false} initialValues={user}>
          <Flex gap={12}>
            <Form.Item label="Ad" name="firstName" style={{ flex: 1 }} rules={[{ required: true, whitespace: true, message: 'Ad girin.' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Soyad" name="lastName" style={{ flex: 1 }} rules={[{ required: true, whitespace: true, message: 'Soyad girin.' }]}>
              <Input />
            </Form.Item>
          </Flex>
          <Form.Item
            label="E-posta"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Geçerli bir e-posta girin.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Kullanıcı adı"
            name="userName"
            rules={[{ required: true, whitespace: true, message: 'Kullanıcı adı girin.' }]}
            extra="Kullanıcı bununla veya e-postasıyla giriş yapar."
          >
            <Input />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}

function RoleModal({
  user,
  amSuperAdmin,
  myId,
  onClose,
}: {
  user: UserWithRoles | null
  amSuperAdmin: boolean
  myId?: number
  onClose: () => void
}) {
  const { message } = App.useApp()
  const { data: roles, isLoading: rolesLoading } = useRoleList()
  const { data: claims, isLoading: claimsLoading } = useUserClaims(user?.id ?? null)
  const toggle = useToggleRole()
  const [pendingRole, setPendingRole] = useState<number | null>(null)

  const handleToggle = async (roleId: number, roleName: string, checked: boolean) => {
    if (!user) return
    const claim = claims?.find((c) => c.operationClaimId === roleId)
    setPendingRole(roleId)
    try {
      await toggle.mutateAsync({ userId: user.id, roleId, claim: checked ? undefined : claim })
      message.success(`${roleLabel(roleName)} rolü ${checked ? 'eklendi' : 'kaldırıldı'}.`)
    } catch (err) {
      message.error(getErrorMessage(err))
    } finally {
      setPendingRole(null)
    }
  }

  const sortedRoles = useMemo(() => {
    const order: string[] = Object.values(Roles)
    return [...(roles ?? [])].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
  }, [roles])

  return (
    <Modal
      title={user ? `Roller — ${fullName(user)}` : 'Roller'}
      open={!!user}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Kapat</Button>}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="Değişiklikler hemen kaydedilir; kullanıcı yeni rolleri bir sonraki girişinde görür."
      />
      {rolesLoading || claimsLoading ? (
        <Spin />
      ) : (
        <Flex vertical gap={12}>
          {sortedRoles.map((role) => {
            const checked = claims?.some((c) => c.operationClaimId === role.id) ?? false
            const superLocked = role.name === Roles.SuperAdmin && !amSuperAdmin
            // Kendi yönetici rolünü kaldırmak hesabı kilitleyebilir
            const selfLocked = user?.id === myId && Yonetici.includes(role.name) && checked
            return (
              <Checkbox
                key={role.id}
                checked={checked}
                disabled={superLocked || selfLocked || pendingRole !== null}
                onChange={(e) => void handleToggle(role.id, role.name, e.target.checked)}
              >
                <Flex vertical>
                  <span style={{ fontWeight: 600 }}>
                    {roleLabel(role.name)} {pendingRole === role.id && <Spin size="small" />}
                  </span>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {ROLE_DESCRIPTIONS[role.name]}
                    {superLocked && ' (Sadece süper yönetici değiştirebilir.)'}
                    {selfLocked && ' (Kendi yönetici rolünüzü kaldıramazsınız.)'}
                  </Typography.Text>
                </Flex>
              </Checkbox>
            )
          })}
        </Flex>
      )}
    </Modal>
  )
}
