import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api/client'
import { renderWithProviders } from '../test/renderWithProviders'
import BugReportModal from './BugReportModal'

describe('BugReportModal', () => {
  it('açıklama zorunlu; görüntüyle birlikte gönderir ve numarayı gösterir', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { success: true, message: '', data: 42 } })
    const shot = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/jpeg' })

    renderWithProviders(<BugReportModal open screenshot={{ blob: shot, dataUrl: 'data:image/jpeg;base64,/9j/' }} onClose={() => {}} />)
    expect(screen.getByAltText('Gönderilecek ekran görüntüsü')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Gönder' }))
    expect(await screen.findByText('Kısaca ne olduğunu yazın.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText('Ne yapıyordunuz, ne oldu?'), 'Takvim açılmadı')
    await userEvent.click(screen.getByRole('button', { name: 'Gönder' }))
    expect(await screen.findByText(/No: 42/)).toBeInTheDocument()

    const form = post.mock.calls[0][1] as FormData
    expect(form.get('description')).toBe('Takvim açılmadı')
    expect(form.get('screenshot')).toBeInstanceOf(Blob)
    expect(JSON.parse(form.get('clientLog') as string)).toBeInstanceOf(Array)
  })

  it('görüntü eki kapatılırsa görüntü gönderilmez', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { success: true, message: '', data: 7 } })
    renderWithProviders(<BugReportModal open screenshot={{ blob: new Blob(['x']), dataUrl: 'data:image/jpeg;base64,eA==' }} onClose={() => {}} />)
    await userEvent.click(screen.getByRole('switch', { name: 'Ekran görüntüsünü ekle' }))
    expect(screen.queryByAltText('Gönderilecek ekran görüntüsü')).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Ne yapıyordunuz, ne oldu?'), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Gönder' }))
    await waitFor(() => expect(post).toHaveBeenCalled())
    expect((post.mock.calls[0][1] as FormData).get('screenshot')).toBeNull()
  })
})
