/** Yöneticinin açtığı hesabın giriş bilgileri (geçici parola yalnızca bir kez döner) */
export interface CreatedAccount {
  userId: number
  userName: string
  email: string
  temporaryPassword: string
}

export interface BulkRowResult {
  /** Gönderilen listedeki 1'den başlayan sıra */
  row: number
  success: boolean
  message: string
  account?: CreatedAccount | null
}

export interface BulkResult {
  successCount: number
  errorCount: number
  rows: BulkRowResult[]
}
