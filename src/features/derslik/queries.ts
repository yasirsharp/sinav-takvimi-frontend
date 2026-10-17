import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { derslikApi, type DerslikFormValues } from '../../api/derslik'

export const derslikKeys = { all: ['derslikler'] as const }

export function useDerslikler() {
  return useQuery({ queryKey: derslikKeys.all, queryFn: derslikApi.list })
}

export function useSaveDerslik() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: DerslikFormValues }) =>
      id ? derslikApi.update(id, values) : derslikApi.create(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: derslikKeys.all }),
  })
}

export function useDeleteDerslik() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: derslikApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: derslikKeys.all }),
  })
}
