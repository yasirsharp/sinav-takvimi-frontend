import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sinavApi, type SinavFormPayload } from '../../api/sinav'
import { musaitlikApi } from '../../api/musaitlik'

export const sinavKeys = {
  all: ['sinavlar'] as const,
  range: (start: string, end: string) => ['sinavlar', start, end] as const,
}

/** Görünen tarih aralığındaki sınavlar. Takvimde ileri/geri giderken önceki veri ekranda kalır. */
export function useSinavlar(start: string | null, end: string | null) {
  return useQuery({
    queryKey: sinavKeys.range(start ?? '', end ?? ''),
    queryFn: () => sinavApi.listByDateRange(start!, end!),
    enabled: !!start && !!end,
    placeholderData: keepPreviousData,
  })
}

export function useSaveSinav() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: SinavFormPayload }) =>
      id ? sinavApi.update(id, values) : sinavApi.create(values),
    // Sınavı olan DBAP silinemediği için ders atamaları da etkilenir
    onSettled: () => queryClient.invalidateQueries({ queryKey: sinavKeys.all }),
  })
}

export function useDeleteSinav() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sinavApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sinavKeys.all }),
  })
}

/** Seçilen tarih/saatte müsait olmadığını bildirmiş personel */
export function useMesgulPersonel(tarih?: string, baslangic?: string, bitis?: string) {
  return useQuery({
    queryKey: ['mesgulPersonel', tarih, baslangic, bitis],
    queryFn: () => musaitlikApi.mesgulPersonelIds(tarih!, baslangic!, bitis!),
    enabled: !!tarih && !!baslangic && !!bitis,
    staleTime: 60_000,
  })
}
