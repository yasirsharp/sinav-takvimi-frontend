import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { hasAnyRole } from './roles'
import { useAuth } from './useAuth'
import ForbiddenPage from '../pages/ForbiddenPage'

interface ProtectedRouteProps {
  /** Boş bırakılırsa giriş yapmış her kullanıcı erişebilir */
  roles?: readonly string[]
}

export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!hasAnyRole(user.roles, roles)) {
    return <ForbiddenPage />
  }

  return <Outlet />
}
