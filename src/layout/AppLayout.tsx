import { Suspense, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Drawer, Dropdown, Flex, Grid, Layout, Menu, Spin, Tooltip, Typography } from 'antd'
import type { MenuProps } from 'antd'
import {
  BugOutlined,
  CompassOutlined,
  DownOutlined,
  KeyOutlined,
  LogoutOutlined,
  MobileOutlined,
  MenuOutlined,
  QuestionCircleOutlined,
  RollbackOutlined,
  SwapOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { useAuth } from '../auth/useAuth'
import { Planlayici, Yonetici, hasAnyRole, roleLabel } from '../auth/roles'
import { flattenNavigation, isGroup, menuFor } from './navigation'
import { useSwitchUser } from '../auth/useSwitchUser'
import { readRecentUsers } from '../auth/recentUsers'
import { usePendingTalepCount } from '../features/talep/queries'
import NotificationBell from './NotificationBell'
import AnnouncementPopup from './AnnouncementPopup'
import ErrorBoundary from '../components/ErrorBoundary'
import { appVersionLabel } from '../utils/appInfo'
import { useBugReport } from '../bugReport/bugReportContext'
import { BUG_SHORTCUT_LABEL } from '../bugReport/shortcut'
import { useNewBugReportCount } from '../features/bugReport/queries'
import { brand, currentYear } from '../theme'
import { useTour } from '../tour/tourContext'
import { GENEL_TOUR_ID } from '../tour/tourModel'
import logoUrl from '../assets/duzce-logo.png'

const { Content, Footer } = Layout

const BUG_REPORTS_PATH = '/yonetim/hata-bildirimleri'
const TALEPLER_PATH = '/talepler'

/** duzce.edu.tr'deki gibi ortalanmış içerik genişliği */
const container: CSSProperties = { maxWidth: 1440, margin: '0 auto', padding: '0 24px' }

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.lg
  const [drawerOpen, setDrawerOpen] = useState(false)
  const tour = useTour()

  const roles = useMemo(() => user?.roles ?? [], [user])
  // Geçici parolayla giren kullanıcı parolasını değiştirene kadar menü gösterilmez
  const showMenu = !user?.mustChangePassword

  const menu = useMemo(() => menuFor(roles), [roles])

  // Tarayıcı sekmesinde sayfa adı (menüdeki role özgü ad önceliklidir: "Sınavlarım" gibi)
  useEffect(() => {
    const item = flattenNavigation(menu).find((i) => i.path === location.pathname) ?? flattenNavigation().find((i) => i.path === location.pathname)
    const label = location.pathname === '/parola-degistir' ? 'Parola değiştir' : item?.label
    document.title = label && location.pathname !== '/' ? `${label} · Sınav Takvimi` : 'Sınav Takvimi · Düzce Üniversitesi'
  }, [location.pathname, menu])

  const bugReport = useBugReport()
  const isYonetici = hasAnyRole(roles, Yonetici)
  const { data: newBugReports } = useNewBugReportCount(isYonetici && showMenu)
  const { data: pendingTalepler } = usePendingTalepCount(hasAnyRole(roles, Planlayici) && showMenu)
  const { canSwitch, switchTo, backToSelf } = useSwitchUser()
  const actAsBy = user?.actAsBy
  // Liste süper yöneticinin kimliğiyle tutulur; kişi olarak girilmişken de aynı liste görünür
  const recentUsers = useMemo(
    () => (canSwitch && user ? readRecentUsers(actAsBy?.id ?? user.id).filter((u) => u.id !== user.id) : []),
    [canSwitch, user, actAsBy],
  )

  const badgeFor = (path: string, label: string) => {
    const count = path === BUG_REPORTS_PATH ? newBugReports : path === TALEPLER_PATH ? pendingTalepler : 0
    return count ? (
      <Badge count={count} size="small" offset={[10, 0]}>
        {label}
      </Badge>
    ) : (
      label
    )
  }

  // Sadece kullanıcının rolüne uygun menü öğeleri gösterilir
  const menuItems = useMemo<MenuProps['items']>(
    () =>
      menu
        .filter((entry) => hasAnyRole(roles, entry.roles))
        .map((entry) =>
          isGroup(entry)
            ? {
                key: entry.key,
                icon: isMobile ? entry.icon : undefined,
                label: entry.label,
                children: entry.children
                  .filter((child) => hasAnyRole(roles, child.roles))
                  .map((child) => ({ key: child.path, icon: child.icon, label: badgeFor(child.path, child.label) })),
              }
            : { key: entry.path, icon: isMobile ? entry.icon : undefined, label: badgeFor(entry.path, entry.label) },
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [menu, roles, isMobile, newBugReports, pendingTalepler],
  )

  const openGroup = menu.find(
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
    ...(canSwitch && showMenu
      ? [
          {
            key: 'switch',
            icon: <UserSwitchOutlined />,
            label: 'Kullanıcı değiştir',
            children: [
              ...(actAsBy
                ? [
                    {
                      key: 'switch-self',
                      icon: <RollbackOutlined />,
                      label: `Kendi hesabıma dön (${actAsBy.name || 'süper yönetici'})`,
                      onClick: () => void backToSelf(),
                    },
                  ]
                : []),
              ...recentUsers.map((u) => ({
                key: `switch-${u.id}`,
                icon: <SwapOutlined />,
                label: (
                  <span>
                    {u.name}
                    {u.roles.length > 0 && (
                      <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                        {u.roles.map(roleLabel).join(', ')}
                      </Typography.Text>
                    )}
                  </span>
                ),
                onClick: () => void switchTo(u.id, u.name),
              })),
              {
                key: 'switch-pick',
                icon: <UserOutlined />,
                label: actAsBy ? 'Başka bir kullanıcı seç… (kendi hesabınızda)' : 'Kullanıcı seç…',
                disabled: !!actAsBy,
                onClick: () => navigate('/yonetim/kullanicilar'),
              },
            ],
          },
        ]
      : []),
    // Kişi olarak girilmişken başkasının parolası değiştirilemez (sunucu da reddeder)
    ...(!actAsBy
      ? [
          {
            key: 'password',
            icon: <KeyOutlined />,
            label: 'Parolamı değiştir',
            onClick: () => navigate('/parola-degistir'),
          },
        ]
      : []),
    ...(showMenu && tour
      ? [
          {
            key: 'tour',
            icon: <CompassOutlined />,
            label: 'Tanıtım turunu başlat',
            onClick: () => tour.start(GENEL_TOUR_ID),
          },
          {
            key: 'help',
            icon: <QuestionCircleOutlined />,
            label: 'Yardım merkezi',
            onClick: () => navigate('/yardim'),
          },
        ]
      : []),
    ...(showMenu && bugReport
      ? [
          {
            key: 'feedback',
            icon: <BugOutlined />,
            label: `Sorun bildir (${BUG_SHORTCUT_LABEL})`,
            onClick: () => bugReport.open(),
          },
          ...(bugReport.shakeSupported
            ? [
                {
                  key: 'shake',
                  icon: <MobileOutlined />,
                  label: bugReport.shakeEnabled ? 'Sallayınca hata bildir: açık' : 'Sallayınca hata bildir: kapalı',
                  onClick: () => void bugReport.setShakeEnabled(!bugReport.shakeEnabled),
                },
              ]
            : []),
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
      {actAsBy && (
        <div
          role="status"
          data-testid="impersonation-banner"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            background: '#d46b08',
            color: '#fff',
            padding: '6px 16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            fontSize: 14,
          }}
        >
          <span>
            <UserSwitchOutlined /> <strong>{user?.name || user?.email}</strong> olarak kullanıyorsunuz
            {roles.length > 0 && <span style={{ opacity: 0.85 }}> ({roles.map(roleLabel).join(', ')})</span>}
          </span>
          <Button size="small" icon={<RollbackOutlined />} onClick={() => void backToSelf()}>
            Kendi hesabıma dön
          </Button>
        </div>
      )}
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
                data-tour="menu"
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
          {showMenu && (
            <Tooltip title="Yardım: özellikleri arayın, turları başlatın">
              <Button
                shape="circle"
                size={isMobile ? 'middle' : 'large'}
                icon={<QuestionCircleOutlined style={{ color: brand.navy }} />}
                aria-label="Yardım"
                data-tour="help"
                onClick={() => navigate('/yardim')}
                style={{ borderColor: '#d3d3d3' }}
              />
            </Tooltip>
          )}
          {showMenu && user && (
            <span data-tour="bell" style={{ display: 'inline-flex' }}>
              <NotificationBell userId={user.id} compact={isMobile} />
            </span>
          )}
          {/* Sitedeki "İLETİŞİM" düğmesi gibi gri çerçeveli, yuvarlak düğme */}
          <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
            <Button
              shape="round"
              size="large"
              data-tour="user-menu"
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
            <div style={{ borderTop: `2px solid ${brand.divider}` }} data-tour="menu">
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
        {showMenu && bugReport && (
          <Button
            type="link"
            size="small"
            data-tour="feedback"
            onClick={() => bugReport.open()}
            style={{ color: '#fff', marginLeft: 4, textDecoration: 'underline' }}
          >
            Sorun bildir
          </Button>
        )}
      </Footer>
    </Layout>
  )
}
