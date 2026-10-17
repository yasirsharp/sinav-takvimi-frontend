import { Suspense, useMemo, useState, type CSSProperties } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Button, Drawer, Dropdown, Grid, Layout, Menu, Spin, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { DownOutlined, LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/useAuth'
import { hasAnyRole, roleLabel } from '../auth/roles'
import { isGroup, navigation } from './navigation'
import { brand, currentYear } from '../theme'
import logoUrl from '../assets/duzce-logo.png'

const { Content, Footer } = Layout

/** duzce.edu.tr'deki gibi ortalanmış içerik genişliği */
const container: CSSProperties = { maxWidth: 1440, margin: '0 auto', padding: '0 24px' }

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.lg
  const [drawerOpen, setDrawerOpen] = useState(false)

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
                icon: isMobile ? entry.icon : undefined,
                label: entry.label,
                children: entry.children
                  .filter((child) => hasAnyRole(roles, child.roles))
                  .map((child) => ({ key: child.path, icon: child.icon, label: child.label })),
              }
            : { key: entry.path, icon: isMobile ? entry.icon : undefined, label: entry.label },
        ),
    [roles, isMobile],
  )

  const openGroup = navigation.find(
    (entry) => isGroup(entry) && entry.children.some((child) => child.path === location.pathname),
  )

  const userMenu: MenuProps['items'] = [
    {
      key: 'roles',
      disabled: true,
      label: (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {roles.length ? roles.map(roleLabel).join(', ') : 'Rol atanmamış'}
        </Typography.Text>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Çıkış yap',
      // /login'e yönlendirmeyi ProtectedRoute yapar
      onClick: logout,
    },
  ]

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
    setDrawerOpen(false)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <header style={{ background: '#fff' }}>
        {/* Üst band: sitedeki turkuaz → mavi geçiş, alt köşeleri yuvarlak */}
        <div style={container}>
          <div
            style={{
              height: isMobile ? 10 : 36,
              background: brand.gradient,
              borderRadius: isMobile ? '0 0 10px 10px' : '0 0 28px 28px',
            }}
          />
        </div>

        {/* Logo + slogan + kullanıcı */}
        <div
          style={{
            ...container,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingTop: isMobile ? 12 : 20,
            paddingBottom: isMobile ? 12 : 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: 20, color: brand.navy }} />}
                aria-label="Menüyü aç"
                onClick={() => setDrawerOpen(true)}
              />
            )}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault()
                navigate('/')
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 0 }}
              aria-label="Ana sayfa"
            >
              <img
                src={logoUrl}
                alt="Düzce Üniversitesi"
                style={{ height: isMobile ? 26 : 46, width: 'auto', maxWidth: '100%' }}
              />
              <span
                style={{
                  color: brand.muted,
                  fontStyle: 'italic',
                  fontSize: isMobile ? 12 : 17,
                  marginTop: isMobile ? 2 : 6,
                  whiteSpace: 'nowrap',
                }}
              >
                Sınav Takvimi Sistemi
              </span>
            </a>
          </div>

          {/* Sitedeki "İLETİŞİM" düğmesi gibi gri çerçeveli, yuvarlak düğme */}
          <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
            <Button
              shape="round"
              size="large"
              style={{ borderColor: '#d3d3d3', color: brand.navy, flexShrink: 0, paddingInline: isMobile ? 8 : 16 }}
            >
              <Avatar size="small" icon={<UserOutlined />} style={{ background: brand.navy }} />
              {!isMobile && <span style={{ fontWeight: 600 }}>{user?.name || user?.email}</span>}
              <DownOutlined style={{ fontSize: 11 }} />
            </Button>
          </Dropdown>
        </div>

        {/* Ana menü: ince gri ayırıcı, büyük harfli menü, kalın lacivert çizgi */}
        {!isMobile && (
          <div style={container}>
            <div style={{ borderTop: `2px solid ${brand.divider}` }}>
              <Menu
                className="du-main-menu"
                mode="horizontal"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={onMenuClick}
                style={{ justifyContent: 'center', background: 'transparent' }}
              />
            </div>
            <div style={{ height: 6, background: brand.navy, borderRadius: 3 }} />
          </div>
        )}
        {isMobile && <div style={{ height: 4, background: brand.navy }} />}
      </header>

      <Drawer
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        size={280}
        title={<img src={logoUrl} alt="Düzce Üniversitesi" style={{ height: 22 }} />}
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={openGroup && isGroup(openGroup) ? [openGroup.key] : []}
          items={menuItems}
          onClick={onMenuClick}
          style={{ borderInlineEnd: 'none' }}
        />
      </Drawer>

      <Content style={{ ...container, width: '100%', boxSizing: 'border-box', paddingTop: 24, paddingBottom: 24 }}>
        <Suspense fallback={<Spin size="large" style={{ display: 'block', margin: '64px auto' }} />}>
          <Outlet />
        </Suspense>
      </Content>

      <Footer style={{ background: brand.navy, color: 'rgba(255,255,255,0.85)', textAlign: 'center', padding: '16px 24px' }}>
        © {currentYear} Düzce Üniversitesi · Sınav Takvimi Sistemi
      </Footer>
    </Layout>
  )
}
