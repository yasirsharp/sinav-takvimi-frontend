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
} from '@ant-design/icons'
import { Personel, Yonetici } from '../auth/roles'
import { AkademikPersonelPage, BolumPage, DersPage, DerslikPage } from './lazyPages'

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
 * Menü ve rotalar bu tek listeden üretilir. Yeni ekran eklerken buraya ekleyin.
 */
export const navigation: NavEntry[] = [
  { path: '/', label: 'Ana Sayfa', icon: <HomeOutlined /> },
  { path: '/sinav-takvimi', label: 'Sınav Takvimi', icon: <CalendarOutlined /> },
  {
    key: 'tanimlar',
    label: 'Tanımlar',
    icon: <DatabaseOutlined />,
    roles: Personel,
    children: [
      { path: '/tanimlar/bolumler', label: 'Bölümler', icon: <ApartmentOutlined />, roles: Personel, element: <BolumPage /> },
      { path: '/tanimlar/dersler', label: 'Dersler', icon: <BookOutlined />, roles: Personel, element: <DersPage /> },
      { path: '/tanimlar/derslikler', label: 'Derslikler', icon: <BankOutlined />, roles: Personel, element: <DerslikPage /> },
      {
        path: '/tanimlar/akademik-personel',
        label: 'Akademik Personel',
        icon: <TeamOutlined />,
        roles: Personel,
        element: <AkademikPersonelPage />,
      },
    ],
  },
  { path: '/musaitlik', label: 'Müsaitlik', icon: <ClockCircleOutlined />, roles: Personel },
  {
    key: 'yonetim',
    label: 'Yönetim',
    icon: <SafetyOutlined />,
    roles: Yonetici,
    children: [
      { path: '/yonetim/kullanicilar', label: 'Kullanıcılar', icon: <UserOutlined />, roles: Yonetici },
      { path: '/yonetim/yetkiler', label: 'Yetkiler', icon: <SafetyOutlined />, roles: Yonetici },
    ],
  },
]

/** Tüm sayfa öğelerini (grupların içindekiler dahil) düz liste olarak döner */
export function flattenNavigation(entries: NavEntry[] = navigation): NavItem[] {
  return entries.flatMap((entry) => (isGroup(entry) ? entry.children : [entry]))
}
