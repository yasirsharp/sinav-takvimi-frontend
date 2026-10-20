import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

function Boom({ message }: { message: string }): never {
  throw new Error(message)
}

describe('ErrorBoundary', () => {
  it('sayfa çökerse dostça hata gösterir', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Boom message="beklenmeyen" />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Bu sayfa görüntülenirken bir hata oluştu')).toBeInTheDocument()
  })

  it('yeni sürümden sonra parça yüklenemezse yenilemeyi önerir', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Boom message="Failed to fetch dynamically imported module: /assets/x.js" />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Uygulama güncellendi')).toBeInTheDocument()
  })
})
