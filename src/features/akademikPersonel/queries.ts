import { useAuth } from '../../auth/useAuth'
import { Roles } from '../../auth/roles'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { akademikPersonelApi, type AkademikPersonel, type AkademikPersonelFormValues } from '../../api/akademikPersonel'

export const personelKeys = { all: ['akademikPersonel'] as const }

export function useAkademikPersoneller() {
  return useQuery({ queryKey: personelKeys.all, queryFn: akademikPersonelApi.list })
}

export function useSaveAkademikPersonel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ personel, values }: { personel?: AkademikPersonel; values: AkademikPersonelFormValues }) =>
      personel ? akademikPersonelApi.update(personel, values) : akademikPersonelApi.create(values),
    // Personel adı bölüm görevli listelerinde de görünür
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

export function useDeleteAkademikPersonel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: akademikPersonelApi.remove,
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

/**
 * Giriş yapan kullanıcının akademik personel kaydı. Yönetici hesaplarının genelde kaydı olmadığı için gereksiz
 * 404'ü önlemek amacıyla sadece personel rollerinde sorulur. hasRecord=false: kayıt yok veya sorulmadı.
 */
export function useOwnPersonel() {
  const { user } = useAuth()
  const enabled = !!user && user.roles.some((r) => r === Roles.AkademikPersonel || r === Roles.BolumGorevlisi || r === Roles.GorevliPersonel)
  const query = useQuery({
    queryKey: ['akademikPersonel', 'me', user?.id],
    queryFn: () => akademikPersonelApi.getByUserId(user!.id),
    enabled,
    retry: false,
    staleTime: Infinity,
  })
  return {
    personel: query.data,
    isLoading: enabled && query.isLoading,
    hasRecord: enabled && query.isSuccess,
    noRecord: !enabled || query.isError,
  }
}
