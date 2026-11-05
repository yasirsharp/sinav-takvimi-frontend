import type { ReactNode } from 'react'
import {
  BankOutlined,
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserOutlined,
  ApartmentOutlined,
  DatabaseOutlined,
  SolutionOutlined,
  IdcardOutlined,
  NotificationOutlined,
  QuestionCircleOutlined,
  BugOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { BolumOkuyucu, Personel, Planlayici, Roles, Yonetici, hasAnyRole } from '../auth/roles'
import {
  AkademikPersonelPage,
  BugReportsPage,
  BolumPage,
  DbapPage,
  DersPage,
  DerslikPage,
  DuyuruPage,
  HelpPage,
  MusaitlikPage,
  OgrenciPage,
  SinavTakvimiPage,
  TalepPage,
  UsersPage,
} from './lazyPages'

export interface NavItem {
  path: string
  label: string
  icon: ReactNode
  /** Boşsa giriş yapmış herkes görür. Backend'deki [Authorize(Roles = ...)] ile aynı tutulmalı. */
  roles?: readonly string[]
  /** Sayfa bileşeni. Verilmezse "yakında" sayfası gösterilir. */
  element?: ReactNode
}

export interface NavGroup {
  key: string
  label: string
  icon: ReactNode
  roles?: readonly string[]
  children: NavItem[]
}

export type NavEntry = NavItem | NavGroup

export function isGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry
}

/**
 * Bütün rotalar bu listeden üretilir (adresler değişmez, eski bağlantılar çalışır). Menüde ne görüneceğini ve hangi
 * adla görüneceğini role göre `menuFor` belirler. Yeni ekran eklerken ikisine de ekleyin.
 */
export const navigation: NavEntry[] = [
  { path: '/', label: 'Ana Sayfa', icon: <HomeOutlined /> },
  { path: '/sinav-takvimi', label: 'Sınav Takvimi', icon: <CalendarOutlined />, element: <SinavTakvimiPage /> },
  { path: '/talepler', label: 'Talepler', icon: <InboxOutlined />, roles: Personel, element: <TalepPage /> },
  {
    key: 'tanimlar',
    label: 'Tanımlar',
    icon: <DatabaseOutlined />,
    roles: BolumOkuyucu,
    children: [
      { path: '/tanimlar/bolumler', label: 'Bölümler', icon: <ApartmentOutlined />, roles: BolumOkuyucu, element: <BolumPage /> },
      { path: '/tanimlar/dersler', label: 'Dersler', icon: <BookOutlined />, roles: BolumOkuyucu, element: <DersPage /> },
      { path: '/tanimlar/derslikler', label: 'Derslikler', icon: <BankOutlined />, roles: BolumOkuyucu, element: <DerslikPage /> },
      {
        path: '/tanimlar/akademik-personel',
        label: 'Akademik Personel',
        icon: <TeamOutlined />,
        roles: BolumOkuyucu,
        element: <AkademikPersonelPage />,
      },
      {
        path: '/tanimlar/ders-atamalari',
        label: 'Ders Atamaları',
        icon: <SolutionOutlined />,
        roles: BolumOkuyucu,
        element: <DbapPage />,
      },
      // Kişisel veri: yönetici tümünü, bölüm görevlisi ve görevli personel kendi bölüm(ler)ini görür
      { path: '/tanimlar/ogrenciler', label: 'Öğrenciler', icon: <IdcardOutlined />, roles: BolumOkuyucu, element: <OgrenciPage /> },
    ],
  },
  { path: '/musaitlik', label: 'Müsaitlik', icon: <ClockCircleOutlined />, roles: Personel, element: <MusaitlikPage /> },
  {
    key: 'yonetim',
    label: 'Yönetim',
    icon: <SafetyOutlined />,
    roles: Planlayici,
    children: [
      { path: '/yonetim/kullanicilar', label: 'Kullanıcılar', icon: <UserOutlined />, roles: Yonetici, element: <UsersPage /> },
      // Bölüm görevlisi kendi bölümüne duyuru yayınlar
      { path: '/yonetim/duyurular', label: 'Duyurular', icon: <NotificationOutlined />, roles: Planlayici, element: <DuyuruPage /> },
      { path: '/yonetim/hata-bildirimleri', label: 'Hata bildirimleri', icon: <BugOutlined />, roles: Yonetici, element: <BugReportsPage /> },
    ],
  },
  // Menüde yok: üstteki ? düğmesi ve profil menüsünden açılır
  { path: '/yardim', label: 'Yardım', icon: <QuestionCircleOutlined />, element: <HelpPage /> },
]

const byPath = new Map(flattenNavigation().map((item) => [item.path, item]))

function page(path: string, label?: string): NavItem {
  const item = byPath.get(path)!
  return label ? { ...item, label } : item
}

function group(key: string, label: string, icon: ReactNode, children: NavItem[]): NavGroup {
  return { key, label, icon, children }
}

/**
 * Role göre sade menü. Birden çok rolü olan kişi en geniş rolün menüsünü görür
 * (yönetici > bölüm görevlisi > görevli personel > akademik personel > öğrenci).
 */
export function menuFor(roles: readonly string[]): NavEntry[] {
  const ana = page('/')
  const ap = roles.includes(Roles.AkademikPersonel)

  if (hasAnyRole(roles, Yonetici)) {
    return [
      ana,
      page('/sinav-takvimi'),
      page('/talepler'),
      group('tanimlar', 'Tanımlar', <DatabaseOutlined />, [
        page('/tanimlar/bolumler'),
        page('/tanimlar/dersler'),
        page('/tanimlar/derslikler'),
        page('/tanimlar/akademik-personel', 'Personel'),
        page('/tanimlar/ders-atamalari'),
        page('/tanimlar/ogrenciler'),
        page('/musaitlik', 'Müsaitlikler'),
      ]),
      group('yonetim', 'Yönetim', <SafetyOutlined />, [
        page('/yonetim/kullanicilar'),
        page('/yonetim/duyurular'),
        page('/yonetim/hata-bildirimleri'),
      ]),
    ]
  }

  const gorevli = roles.includes(Roles.BolumGorevlisi)
  if (gorevli || roles.includes(Roles.GorevliPersonel)) {
    const bolumum = group('bolumum', 'Bölümüm', <ApartmentOutlined />, [
      page('/tanimlar/dersler'),
      page('/tanimlar/derslikler'),
      page('/tanimlar/akademik-personel', 'Personel'),
      page('/tanimlar/ders-atamalari'),
      page('/tanimlar/ogrenciler'),
      page('/musaitlik', 'Müsaitlikler'),
    ])
    return [
      ana,
      page('/sinav-takvimi'),
      ...(gorevli ? [page('/talepler')] : ap ? [page('/talepler', 'Taleplerim')] : []),
      bolumum,
      ...(gorevli ? [page('/yonetim/duyurular')] : []),
    ]
  }

  if (ap) {
    return [ana, page('/sinav-takvimi', 'Sınavlarım'), page('/musaitlik', 'Müsaitliğim'), page('/talepler', 'Taleplerim')]
  }

  return [ana, page('/sinav-takvimi', 'Sınavlarım')]
}

/** Tüm sayfa öğelerini (grupların içindekiler dahil) düz liste olarak döner */
export function flattenNavigation(entries: NavEntry[] = navigation): NavItem[] {
  return entries.flatMap((entry) => (isGroup(entry) ? entry.children : [entry]))
}
