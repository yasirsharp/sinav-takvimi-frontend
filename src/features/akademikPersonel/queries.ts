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
