import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { talepApi, type SinavTalepCreate } from '../../api/talep'

export const talepKeys = {
  all: ['talepler'] as const,
  pending: ['talepler', 'bekleyen'] as const,
}

export function useTalepler() {
  return useQuery({ queryKey: talepKeys.all, queryFn: () => talepApi.list() })
}

/** Menü rozeti: yanıtlayabileceğim bekleyen talepler (yalnızca planlayıcılarda sorulur) */
export function usePendingTalepCount(enabled: boolean) {
  return useQuery({ queryKey: talepKeys.pending, queryFn: talepApi.pendingCount, enabled, refetchInterval: 120_000 })
}

export function useCreateTalep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: SinavTalepCreate) => talepApi.create(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: talepKeys.all }),
  })
}

export function useAnswerTalep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, durum, not }: { id: number; durum: 'kabul' | 'red'; not?: string }) => talepApi.answer(id, durum, not),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: talepKeys.all }),
  })
}
