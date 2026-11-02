import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/renderWithProviders'
import { BugReportContext, type BugReportContextValue } from './bugReportContext'
import { useErrorToast } from './useErrorToast'

function Trigger() {
  const showError = useErrorToast()
  return <button onClick={() => showError(new Error('Derslik bu saatte dolu.'))}>dene</button>
}

describe('useErrorToast', () => {
  it('hata mesajının yanında "Bu bir hata mı? Bildir" bağlantısı; tıklanınca önceden doldurulmuş bildirim açılır', async () => {
    const open = vi.fn()
    const ctx: BugReportContextValue = { open, shakeEnabled: false, setShakeEnabled: async () => true, shakeSupported: false }
    renderWithProviders(
      <BugReportContext.Provider value={ctx}>
        <Trigger />
      </BugReportContext.Provider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'dene' }))
    expect(await screen.findByText('Derslik bu saatte dolu.')).toBeInTheDocument()
    await act(async () => userEvent.click(screen.getByText('Bu bir hata mı? Bildir')))
    expect(open).toHaveBeenCalledWith({ description: expect.stringContaining('Derslik bu saatte dolu.') })
  })
})
