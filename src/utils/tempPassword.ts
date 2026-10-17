export interface TemporaryCredentials {
  userName: string
  password: string
}

/**
 * Backend'in akademik personel ekleme mesajından giriş bilgilerini ayrıştırır.
 * Örnek: "Akademik Personel Eklendi. Kullanıcı adı: AY1234, geçici parola: Xk9..."
 */
export function parseTemporaryCredentials(message: string | null | undefined): TemporaryCredentials | null {
  const match = /Kullanıcı adı:\s*(\S+?),\s*geçici parola:\s*(\S+)/i.exec(message ?? '')
  return match ? { userName: match[1], password: match[2] } : null
}
