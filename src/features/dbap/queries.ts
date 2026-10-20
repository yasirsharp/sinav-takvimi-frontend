import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dbapApi, type DbapFormValues } from '../../api/dbap'

export const dbapKeys = { all: ['dbap'] as const }

export function useDbapList() {
  return useQuery({ queryKey: dbapKeys.all, queryFn: dbapApi.list })
}

export function useSaveDbap() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: DbapFormValues }) =>
      id ? dbapApi.update(id, values) : dbapApi.create(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dbapKeys.all }),
  })
}

export function useDeleteDbap() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dbapApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dbapKeys.all }),
  })
}
