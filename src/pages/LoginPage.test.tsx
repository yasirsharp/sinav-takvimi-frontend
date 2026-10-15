import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api/client'
import { buildLoginRequest } from '../api/auth'
import { AuthProvider } from '../auth/AuthContext'
import LoginPage from './LoginPage'
import { CLAIMS, futureExp, makeToken } from '../test/tokens'

describe('buildLoginRequest', () => {
  it('@ içeren değeri e-posta, diğerini kullanıcı adı olarak gönderir', () => {
    expect(buildLoginRequest(' ali@duzce.edu.tr ', 'x')).toEqual({ email: 'ali@duzce.edu.tr', password: 'x' })
    expect(buildLoginRequest('ali', 'x')).toEqual({ userName: 'ali', password: 'x' })
  })
})

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Ana sayfa içeriği</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('başarılı girişte tokenı saklar ve ana sayfaya yönlendirir', async () => {
    const token = makeToken({ [CLAIMS.id]: '1', [CLAIMS.name]: 'Test', [CLAIMS.role]: 'Admin', exp: futureExp() })
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { success: true, message: 'ok', data: { token, expiration: '' } },
    })

    renderLogin()
    await userEvent.type(screen.getByLabelText('E-posta veya kullanıcı adı'), 'admin')
    await userEvent.type(screen.getByLabelText('Parola'), 'Parola123')
    await userEvent.click(screen.getByRole('button', { name: /giriş yap/i }))

    expect(await screen.findByText('Ana sayfa içeriği')).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/api/Auth/login', { userName: 'admin', password: 'Parola123' })
    expect(localStorage.getItem('sinav-takvimi.token')).toBe(token)
  })

  it('hatalı girişte backend mesajını gösterir', async () => {
    const { AxiosError, AxiosHeaders } = await import('axios')
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      new AxiosError('fail', 'ERR', undefined, undefined, {
        status: 400,
        statusText: '',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: { success: false, message: 'E-posta/kullanıcı adı veya şifre hatalı.', data: null },
      }),
    )

    renderLogin()
    await userEvent.type(screen.getByLabelText('E-posta veya kullanıcı adı'), 'x@y.com')
    await userEvent.type(screen.getByLabelText('Parola'), 'yanlis')
    await userEvent.click(screen.getByRole('button', { name: /giriş yap/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-posta/kullanıcı adı veya şifre hatalı.')
    expect(localStorage.getItem('sinav-takvimi.token')).toBeNull()
  })
})
