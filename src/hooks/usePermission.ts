import { useAuth } from '../auth/useAuth'
import { hasAnyRole } from '../auth/roles'

/** Kullanıcının verilen rol grubundan en az bir role sahip olup olmadığını döner */
export function useCan(roles: readonly string[]): boolean {
  const { user } = useAuth()
  return !!user && hasAnyRole(user.roles, roles)
}
