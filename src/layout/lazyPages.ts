import { lazy } from 'react'

// Sayfalar ilk açıldıklarında indirilir (kod bölme); AppLayout içindeki Suspense yükleniyor durumunu gösterir
export const BolumPage = lazy(() => import('../features/bolum/BolumPage'))
export const DersPage = lazy(() => import('../features/ders/DersPage'))
export const DerslikPage = lazy(() => import('../features/derslik/DerslikPage'))
export const AkademikPersonelPage = lazy(() => import('../features/akademikPersonel/AkademikPersonelPage'))
