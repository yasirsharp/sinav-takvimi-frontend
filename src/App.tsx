import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import AppLayout from './layout/AppLayout'
import { flattenNavigation } from './layout/navigation'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import PlaceholderPage from './pages/PlaceholderPage'

// Ana sayfa dışındaki tüm menü sayfaları; bileşeni olmayanlar "yakında" sayfası gösterir
const pages = flattenNavigation().filter((item) => item.path !== '/')

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          {pages.map((item) => (
            <Route key={item.path} element={<ProtectedRoute roles={item.roles} />}>
              <Route path={item.path} element={item.element ?? <PlaceholderPage title={item.label} />} />
            </Route>
          ))}

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
