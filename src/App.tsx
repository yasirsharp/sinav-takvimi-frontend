import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import AppLayout from './layout/AppLayout'
import { flattenNavigation } from './layout/navigation'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import PlaceholderPage from './pages/PlaceholderPage'

const comingSoonPages = flattenNavigation().filter((item) => item.comingSoon)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          {comingSoonPages.map((item) => (
            <Route key={item.path} element={<ProtectedRoute roles={item.roles} />}>
              <Route path={item.path} element={<PlaceholderPage title={item.label} />} />
            </Route>
          ))}

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
