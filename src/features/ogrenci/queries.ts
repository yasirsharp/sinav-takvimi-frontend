import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ogrenciApi, type OgrenciCreateValues, type OgrenciUpdateValues } from '../../api/ogrenci'

export const ogrenciKeys = { all: ['ogrenciler'] as const }

export function useOgrenciler() {
  return useQuery({ queryKey: ogrenciKeys.all, queryFn: ogrenciApi.list })
}

/** Öğrenci ekleme/silme kullanıcı listesini de değiştirir */
function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ogrenciKeys.all })
  void queryClient.invalidateQueries({ queryKey: ['users'] })
}

export function useCreateOgrenci() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: OgrenciCreateValues) => ogrenciApi.create(values),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useBulkCreateOgrenci() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rows: OgrenciCreateValues[]) => ogrenciApi.bulkCreate(rows),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useUpdateOgrenci() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: OgrenciUpdateValues }) => ogrenciApi.update(id, values),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useDeleteOgrenci() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ogrenciApi.remove,
    onSuccess: () => invalidate(queryClient),
  })
}
