import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from './useAuth'
import { tokenStorage } from './tokenStorage'
import { CLAIMS, futureExp, makeToken } from '../test/tokens'

/** Testte çıkış yapmak ve oturum bitiş nedenini görmek için küçük yardımcı */
function AuthControls() {
  const { logout, sessionEndReason } = useAuth()
  return (
    <>
      <button onClick={logout}>çıkış</button>
      <span>neden: {sessionEndReason ?? '-'}</span>
    </>
  )
}

function LoginProbe() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  return <div>login sayfası, dönülecek: {from ?? 'yok'}</div>
}

function renderAt(path: string, roles: string[] = ['ogrenci']) {
  tokenStorage.set(makeToken({ [CLAIMS.id]: '1', [CLAIMS.role]: roles, exp: futureExp() }))
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AuthControls />
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/sayfa" element={<div>korumalı içerik</div>} />
          </Route>
          <Route element={<ProtectedRoute roles={['super.admin']} />}>
            <Route path="/yonetim" element={<div>yönetim</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('rolü yetmeyen kullanıcıya 403 sayfası gösterir', () => {
    renderAt('/yonetim', ['ogrenci'])
    expect(screen.getByText('Yetkiniz yok')).toBeInTheDocument()
  })

  it('kullanıcı çıkış yapınca girişte önceki sayfa hatırlanmaz', async () => {
    renderAt('/sayfa')
    expect(screen.getByText('korumalı içerik')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'çıkış' }))

    expect(screen.getByText('login sayfası, dönülecek: yok')).toBeInTheDocument()
    expect(screen.getByText('neden: logout')).toBeInTheDocument()
  })

  it('token geçersizse (süre doldu) girişten sonra kalınan sayfaya dönülür', () => {
    tokenStorage.clear()
    render(
      <MemoryRouter initialEntries={['/sayfa']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginProbe />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/sayfa" element={<div>korumalı içerik</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText('login sayfası, dönülecek: /sayfa')).toBeInTheDocument()
  })
})
