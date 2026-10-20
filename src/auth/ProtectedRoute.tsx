import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { hasAnyRole } from './roles'
import { useAuth } from './useAuth'
import ForbiddenPage from '../pages/ForbiddenPage'

export const CHANGE_PASSWORD_PATH = '/parola-degistir'

interface ProtectedRouteProps {
  /** Boş bırakılırsa giriş yapmış her kullanıcı erişebilir */
  roles?: readonly string[]
}

export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, sessionEndReason } = useAuth()
  const location = useLocation()

  if (!user) {
    // Kullanıcı kendisi çıkış yaptıysa kaldığı sayfa hatırlanmaz; sonraki giriş (başka biri olabilir) ana sayfaya gider
    const state = sessionEndReason === 'logout' ? undefined : { from: location.pathname }
    return <Navigate to="/login" replace state={state} />
  }

  // Geçici parolayla giren kullanıcı parolasını değiştirmeden başka sayfaya geçemez
  if (user.mustChangePassword && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />
  }

  if (!hasAnyRole(user.roles, roles)) {
    return <ForbiddenPage />
  }

  return <Outlet />
}
