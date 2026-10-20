import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { roleApi, userApi, type UserOperationClaim, type UserUpdateValues } from '../../api/user'

export const userKeys = {
  all: ['users'] as const,
  roles: ['roles'] as const,
  claims: (userId: number) => ['users', userId, 'claims'] as const,
}

export function useUsers() {
  return useQuery({ queryKey: userKeys.all, queryFn: userApi.listWithRoles })
}

export function useRoleList() {
  return useQuery({ queryKey: userKeys.roles, queryFn: roleApi.list, staleTime: Infinity })
}

export function useUserClaims(userId: number | null) {
  return useQuery({
    queryKey: userKeys.claims(userId ?? 0),
    queryFn: () => roleApi.userClaims(userId!),
    enabled: userId != null,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: UserUpdateValues }) => userApi.update(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: userApi.remove,
    // Kullanıcı silinince personel/öğrenci listeleri de etkilenebilir
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

export function useResetPassword() {
  return useMutation({ mutationFn: userApi.resetPassword })
}

export function useToggleRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId, claim }: { userId: number; roleId: number; claim?: UserOperationClaim }) =>
      claim ? roleApi.remove(claim) : roleApi.add(userId, roleId),
    onSuccess: (_, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all })
      void queryClient.invalidateQueries({ queryKey: userKeys.claims(userId) })
      // Bölüm görevlisi rolü bölüm görevli listelerini etkiler
      void queryClient.invalidateQueries({ queryKey: ['bolumler'] })
    },
  })
}
