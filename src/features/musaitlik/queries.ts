import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { musaitlikApi, type MusaitlikValues } from '../../api/musaitlik'

export const musaitlikKeys = {
  all: ['musaitlik'] as const,
  personel: (personelId: number) => ['musaitlik', personelId] as const,
}

export function useMusaitlikler(personelId: number | null) {
  return useQuery({
    queryKey: musaitlikKeys.personel(personelId ?? 0),
    queryFn: () => musaitlikApi.byPersonel(personelId!),
    enabled: personelId != null,
  })
}

// Müsaitlik değişince sınav formundaki "meşgul gözetmen" sorguları da yenilenir
function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: musaitlikKeys.all })
  void queryClient.invalidateQueries({ queryKey: ['mesgulPersonel'] })
}

export function useSaveMusaitlik() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: MusaitlikValues }) =>
      id ? musaitlikApi.update(id, values) : musaitlikApi.create(values),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useDeleteMusaitlik() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => (ids.length === 1 ? musaitlikApi.remove(ids[0]) : musaitlikApi.removeMany(ids)),
    onSuccess: () => invalidate(queryClient),
  })
}
