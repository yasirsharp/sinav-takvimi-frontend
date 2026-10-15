import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Button, Dropdown, Grid, Layout, Menu, Space, Typography, theme } from 'antd'
import type { MenuProps } from 'antd'
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/useAuth'
import { hasAnyRole, roleLabel } from '../auth/roles'
import { isGroup, navigation } from './navigation'

const { Header, Sider, Content } = Layout

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { token } = theme.useToken()

  const roles = useMemo(() => user?.roles ?? [], [user])

  // Sadece kullanıcının rolüne uygun menü öğeleri gösterilir
  const menuItems = useMemo<MenuProps['items']>(
    () =>
      navigation
        .filter((entry) => hasAnyRole(roles, entry.roles))
        .map((entry) =>
          isGroup(entry)
            ? {
                key: entry.key,
                icon: entry.icon,
                label: entry.label,
                children: entry.children
                  .filter((child) => hasAnyRole(roles, child.roles))
                  .map((child) => ({ key: child.path, icon: child.icon, label: child.label })),
              }
            : { key: entry.path, icon: entry.icon, label: entry.label },
        ),
    [roles],
  )

  const openGroup = navigation.find(
    (entry) => isGroup(entry) && entry.children.some((child) => child.path === location.pathname),
  )

  const userMenu: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Çıkış yap',
      onClick: () => {
        logout()
        navigate('/login', { replace: true })
      },
    },
  ]

  // Masaüstünde menü daraltılır, mobilde ekranın üstüne açılır
  const siderCollapsed = isMobile ? !mobileOpen : desktopCollapsed
  const toggleMenu = () => (isMobile ? setMobileOpen((open) => !open) : setDesktopCollapsed((c) => !c))

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={siderCollapsed}
        collapsedWidth={isMobile ? 0 : 80}
        trigger={null}
        width={240}
        style={{ position: isMobile ? 'fixed' : 'sticky', top: 0, height: '100vh', zIndex: 20 }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: siderCollapsed ? 14 : 16,
            padding: '0 12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {siderCollapsed ? 'DÜ' : 'DÜ Sınav Takvimi'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={openGroup && isGroup(openGroup) ? [openGroup.key] : []}
          items={menuItems}
          onClick={({ key }) => {
            navigate(key)
            if (isMobile) setMobileOpen(false)
          }}
        />
      </Sider>

      {isMobile && mobileOpen && (
        <div
          aria-hidden
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10 }}
        />
      )}

      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Button
            type="text"
            aria-label={siderCollapsed ? 'Menüyü aç' : 'Menüyü kapat'}
            icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleMenu}
          />

          <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
            <Button type="text" style={{ height: 48 }}>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                {!isMobile && (
                  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                    <Typography.Text strong>{user?.name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {roles.length ? roles.map(roleLabel).join(', ') : 'Rol atanmamış'}
                    </Typography.Text>
                  </span>
                )}
              </Space>
            </Button>
          </Dropdown>
        </Header>

        <Content style={{ margin: isMobile ? 12 : 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

