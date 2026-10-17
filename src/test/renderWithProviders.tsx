import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider } from 'antd'
import trTR from 'antd/locale/tr_TR'
import { AuthProvider } from '../auth/AuthContext'
import { tokenStorage } from '../auth/tokenStorage'
import { CLAIMS, futureExp, makeToken } from './tokens'

/** Verilen rollerle giriş yapmış bir kullanıcıyla bileşeni tüm sağlayıcılar içinde render eder */
export function renderWithProviders(ui: ReactElement, { roles = ['super.admin'], bolumIds = [] as number[] } = {}) {
  const extraClaims = Object.fromEntries(bolumIds.map((id, i) => [`${i + 1}.BolumId`, String(id)]))
  tokenStorage.set(
    makeToken({ [CLAIMS.id]: '1', [CLAIMS.name]: 'Test Kullanıcı', [CLAIMS.role]: roles, exp: futureExp(), ...extraClaims }),
  )

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <ConfigProvider locale={trTR}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AuthProvider>{ui}</AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>,
  )
}
