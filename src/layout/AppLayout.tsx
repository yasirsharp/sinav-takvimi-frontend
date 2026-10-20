import { Suspense, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Button, Drawer, Dropdown, Flex, Grid, Layout, Menu, Spin, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { BugOutlined, DownOutlined, KeyOutlined, LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/useAuth'
import { hasAnyRole, roleLabel } from '../auth/roles'
import { flattenNavigation, isGroup, navigation } from './navigation'
import NotificationBell from './NotificationBell'
import AnnouncementPopup from './AnnouncementPopup'
import ErrorBoundary from '../components/ErrorBoundary'
import { appVersionLabel, buildFeedbackMailto, feedbackEmail } from '../utils/appInfo'
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
  // Geçici parolayla giren kullanıcı parolasını değiştirene kadar menü gösterilmez
  const showMenu = !user?.mustChangePassword

  // Tarayıcı sekmesinde sayfa adı
  useEffect(() => {
    const item = flattenNavigation().find((i) => i.path === location.pathname)
    const label = location.pathname === '/parola-degistir' ? 'Parola değiştir' : item?.label
    document.title = label && location.pathname !== '/' ? `${label} · Sınav Takvimi` : 'Sınav Takvimi · Düzce Üniversitesi'
  }, [location.pathname])

  const feedbackHref = feedbackEmail
    ? buildFeedbackMailto(feedbackEmail, {
        url: window.location.href,
        userAgent: navigator.userAgent,
        roles,
        userName: user?.email,
      })
    : null

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
      key: 'password',
      icon: <KeyOutlined />,
      label: 'Parolamı değiştir',
      onClick: () => navigate('/parola-degistir'),
    },
    ...(feedbackHref
      ? [
          {
            key: 'feedback',
            icon: <BugOutlined />,
            label: <a href={feedbackHref}>Sorun bildir</a>,
          },
        ]
      : []),
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
            {isMobile && showMenu && (
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

          <Flex align="center" gap={isMobile ? 6 : 10} style={{ flexShrink: 0 }}>
          {showMenu && user && <NotificationBell userId={user.id} compact={isMobile} />}
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
          </Flex>
        </div>

        {/* Ana menü: ince gri ayırıcı, büyük harfli menü, kalın lacivert çizgi */}
        {!isMobile && showMenu && (
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
        {(isMobile || !showMenu) && <div style={{ ...(isMobile ? {} : container), height: isMobile ? 4 : 6 }}><div style={{ height: '100%', background: brand.navy, borderRadius: isMobile ? 0 : 3 }} /></div>}
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
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<Spin size="large" style={{ display: 'block', margin: '64px auto' }} />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
        {showMenu && <AnnouncementPopup />}
      </Content>

      <Footer style={{ background: brand.navy, color: 'rgba(255,255,255,0.85)', textAlign: 'center', padding: '16px 24px' }}>
        © {currentYear} Düzce Üniversitesi · Sınav Takvimi Sistemi
        <span style={{ opacity: 0.6, marginLeft: 8, fontSize: 12 }}>{appVersionLabel}</span>
        {feedbackHref && (
          <a href={feedbackHref} style={{ color: '#fff', marginLeft: 12, textDecoration: 'underline' }}>
            Sorun bildir
          </a>
        )}
      </Footer>
    </Layout>
  )
}
