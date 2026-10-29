import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/renderWithProviders'
import HelpPage from './HelpPage'

describe('HelpPage', () => {
  it('yöneticiye tüm ekranları listeler, aramayla süzer', async () => {
    renderWithProviders(<HelpPage />)
    expect(screen.getByText('Kullanıcılar')).toBeInTheDocument()
    expect(screen.getByText('Sınav Takvimi')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Yardımda ara'), 'PAROLA SIFIRLA')
    expect(screen.getByText('Kullanıcılar')).toBeInTheDocument()
    expect(screen.queryByText('Derslikler')).not.toBeInTheDocument()
    // Bulunan konu açık gelir
    expect(screen.getByText(/parolayı sıfırlar/)).toBeInTheDocument()
  })

  it('öğrenci yönetim ekranlarını görmez', () => {
    renderWithProviders(<HelpPage />, { roles: ['ogrenci'] })
    expect(screen.getByText('Sınav Takvimi')).toBeInTheDocument()
    expect(screen.queryByText('Kullanıcılar')).not.toBeInTheDocument()
    expect(screen.queryByText('Ders Atamaları')).not.toBeInTheDocument()
  })

  it('sonuç yoksa bilgi verir', async () => {
    renderWithProviders(<HelpPage />, { roles: ['ogrenci'] })
    await userEvent.type(screen.getByLabelText('Yardımda ara'), 'qqqzzz')
    expect(screen.getByText(/için sonuç bulunamadı/)).toBeInTheDocument()
  })
})
