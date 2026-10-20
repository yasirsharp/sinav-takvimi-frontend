import { lazy } from 'react'

// Sayfalar ilk açıldıklarında indirilir (kod bölme); AppLayout içindeki Suspense yükleniyor durumunu gösterir
export const BolumPage = lazy(() => import('../features/bolum/BolumPage'))
export const DersPage = lazy(() => import('../features/ders/DersPage'))
export const DerslikPage = lazy(() => import('../features/derslik/DerslikPage'))
export const AkademikPersonelPage = lazy(() => import('../features/akademikPersonel/AkademikPersonelPage'))
export const DbapPage = lazy(() => import('../features/dbap/DbapPage'))
export const SinavTakvimiPage = lazy(() => import('../features/sinav/SinavTakvimiPage'))
export const OgrenciPage = lazy(() => import('../features/ogrenci/OgrenciPage'))
export const UsersPage = lazy(() => import('../features/users/UsersPage'))
export const DuyuruPage = lazy(() => import('../features/duyuru/DuyuruPage'))
export const MusaitlikPage = lazy(() => import('../features/musaitlik/MusaitlikPage'))
