import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/renderWithProviders'
import { useBolumScope } from './useBolumScope'

function Probe() {
  const s = useBolumScope()
  return (
    <ul>
      <li>scoped:{String(s.isScoped)}</li>
      <li>own1:{String(s.canManage([1]))}</li>
      <li>mixed:{String(s.canManage([1, 2]))}</li>
      <li>ortak:{String(s.canManage([]))}</li>
      <li>access2:{String(s.canAccess(2))}</li>
    </ul>
  )
}

describe('useBolumScope', () => {
  it('bölüm görevlisi yalnızca kendi bölümünü yönetir; ortak ve karışık kayıtlar kilitli', () => {
    renderWithProviders(<Probe />, { roles: ['akademik.personel', 'bolum.gorevlisi'], bolumIds: [1] })
    for (const t of ['scoped:true', 'own1:true', 'mixed:false', 'ortak:false', 'access2:false']) expect(screen.getByText(t)).toBeInTheDocument()
  })

  it('yönetici sınırsızdır', () => {
    renderWithProviders(<Probe />, { roles: ['Admin', 'bolum.gorevlisi'], bolumIds: [1] })
    for (const t of ['scoped:false', 'mixed:true', 'ortak:true', 'access2:true']) expect(screen.getByText(t)).toBeInTheDocument()
  })
})

describe('useBolumScope: görevli personel', () => {
  it('atandığı bölümleri görür, hiçbirini yönetemez', () => {
    renderWithProviders(<Probe />, { roles: ['gorevli.personel'], extraClaims: { '1.OkumaBolumId': '1', '2.OkumaBolumId': '2' } })
    for (const t of ['scoped:true', 'own1:false', 'access2:true']) expect(screen.getByText(t)).toBeInTheDocument()
  })
})
