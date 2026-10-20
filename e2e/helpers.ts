import { expect, type Page } from '@playwright/test'

/** Backend adresi (Vite proxy'den bağımsız doğrudan API çağrıları için) */
export const API = process.env.E2E_API_URL ?? 'http://localhost:8081'

/** Backend'in Seed__AdminEmail / Seed__AdminPassword ayarlarıyla aynı olmalı */
export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@duzce.edu.tr',
  initialPassword: process.env.E2E_ADMIN_PASSWORD ?? 'IlkParola2026',
  password: 'YeniParola2026',
}

export async function api<T = unknown>(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, body: (text ? JSON.parse(text) : null) as { success: boolean; message?: string; data: T } }
}

export async function apiLogin(identifier: string, password: string): Promise<string> {
  const payload = identifier.includes('@') ? { email: identifier, password } : { userName: identifier, password }
  const res = await api<{ token: string }>('POST', '/api/Auth/login', payload)
  expect(res.status, `${identifier} API girişi`).toBe(200)
  return res.body.data.token
}

export const adminToken = () => apiLogin(ADMIN.email, ADMIN.password)

/** Yönetici olarak kullanıcının parolasını sıfırlar, geçici parolayla girip yeni parola belirler */
export async function provisionUser(userName: string, newPassword: string) {
  const token = await adminToken()
  const users = await api<{ id: number; userName: string }[]>('GET', '/api/User/with-roles', undefined, token)
  const user = users.body.data.find((u) => u.userName === userName)
  expect(user, `${userName} kullanıcısı`).toBeTruthy()
  const reset = await api<{ temporaryPassword: string }>('POST', `/api/User/${user!.id}/reset-password`, undefined, token)
  const temp = reset.body.data.temporaryPassword
  const t = await apiLogin(userName, temp)
  const changed = await api('POST', '/api/Auth/change-password', { currentPassword: temp, newPassword }, t)
  expect(changed.status).toBe(200)
}

export async function login(page: Page, identifier: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('E-posta veya kullanıcı adı').fill(identifier)
  await page.getByLabel('Parola').fill(password)
  await page.getByRole('button', { name: 'Giriş yap' }).click()
}

export async function loginAsAdmin(page: Page) {
  await login(page, ADMIN.email, ADMIN.password)
  await page.waitForURL('/')
}

/** YYYY-MM-DD, bugünden n gün sonra. Uygulama ve tarayıcı İstanbul saatiyle çalıştığı için o saat dilimine göre. */
export function dayFromToday(n: number): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date())
  const d = new Date(`${today}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
