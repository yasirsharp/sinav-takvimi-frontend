/**
 * Süper yöneticinin son "kullanıcı olarak gir" dediği kişiler (hızlı geçiş için).
 * Yalnızca bu tarayıcıda, süper yöneticinin kimliğine göre ayrı tutulur; token saklanmaz.
 */
export interface RecentUser {
  id: number
  name: string
  roles: string[]
}

const MAX = 5
const key = (actorId: number) => `sinav-takvimi.recent-users.${actorId}`

export function readRecentUsers(actorId: number): RecentUser[] {
  try {
    const raw = localStorage.getItem(key(actorId))
    const list: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) return []
    return list
      .filter((u): u is RecentUser => typeof u?.id === 'number' && typeof u?.name === 'string')
      .map((u) => ({ id: u.id, name: u.name, roles: Array.isArray(u.roles) ? u.roles.map(String) : [] }))
      .slice(0, MAX)
  } catch {
    return []
  }
}

export function rememberRecentUser(actorId: number, user: RecentUser) {
  const list = [user, ...readRecentUsers(actorId).filter((u) => u.id !== user.id)].slice(0, MAX)
  try {
    localStorage.setItem(key(actorId), JSON.stringify(list))
  } catch {
    // depolama kapalıysa liste tutulmaz
  }
}

export function forgetRecentUser(actorId: number, userId: number) {
  try {
    localStorage.setItem(key(actorId), JSON.stringify(readRecentUsers(actorId).filter((u) => u.id !== userId)))
  } catch {
    // yoksay
  }
}
