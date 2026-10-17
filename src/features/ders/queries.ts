import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dersApi, type DersFormValues } from '../../api/ders'

export const dersKeys = { all: ['dersler'] as const }

export function useDersler() {
  return useQuery({ queryKey: dersKeys.all, queryFn: dersApi.list })
}

export function useSaveDers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: DersFormValues }) =>
      id ? dersApi.update(id, values) : dersApi.create(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dersKeys.all }),
  })
}

export function useDeleteDers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dersApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dersKeys.all }),
  })
}
