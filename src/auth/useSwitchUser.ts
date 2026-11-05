import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { useAuth } from './useAuth'
import { Roles } from './roles'
import { useErrorToast } from '../bugReport/useErrorToast'

/**
 * Kullanıcı değiştirme (yalnızca süper yönetici). Geçişte önceki kişinin önbelleğe alınmış verisi silinir ve ana sayfaya
 * dönülür; böylece ekranda bir önceki hesabın verisi kalmaz.
 */
export function useSwitchUser() {
  const { user, impersonate, stopImpersonation } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const showError = useErrorToast()

  /** Kendi oturumunda süper yönetici ya da süper yöneticinin girdiği bir oturum */
  const canSwitch = !!user && (user.roles.includes(Roles.SuperAdmin) || !!user.actAsBy)

  const reset = useCallback(() => {
    queryClient.clear()
    navigate('/', { replace: true })
  }, [queryClient, navigate])

  const switchTo = useCallback(
    async (userId: number, name?: string) => {
      try {
        await impersonate(userId)
        reset()
        message.success(name ? `${name} olarak kullanıyorsunuz.` : 'Kullanıcı değiştirildi.')
      } catch (err) {
        showError(err)
      }
    },
    [impersonate, reset, message, showError],
  )

  const backToSelf = useCallback(async () => {
    try {
      await stopImpersonation()
      reset()
      message.success('Kendi hesabınıza döndünüz.')
    } catch (err) {
      showError(err)
    }
  }, [stopImpersonation, reset, message, showError])

  return { canSwitch, switchTo, backToSelf }
}
