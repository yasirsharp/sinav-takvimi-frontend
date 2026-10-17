import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bolumApi, type Bolum } from '../../api/bolum'
import { bolumGorevliApi, type BolumGorevlisi } from '../../api/bolumGorevli'

export const bolumKeys = {
  all: ['bolumler'] as const,
  gorevliler: (bolumId: number) => ['bolumler', bolumId, 'gorevliler'] as const,
}

export function useBolumler() {
  return useQuery({ queryKey: bolumKeys.all, queryFn: bolumApi.list, staleTime: 5 * 60_000 })
}

export function useSaveBolum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: { id?: number; ad: string }) =>
      values.id ? bolumApi.update(values as Bolum) : bolumApi.create({ ad: values.ad }),
    // Bölüm adları ders ve derslik listelerinde de görünür
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

export function useDeleteBolum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bolumApi.remove,
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

export function useBolumGorevlileri(bolumId: number) {
  return useQuery({ queryKey: bolumKeys.gorevliler(bolumId), queryFn: () => bolumGorevliApi.list(bolumId) })
}

export function useAssignGorevli(bolumId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (akademikPersonelId: number) => bolumGorevliApi.assign(bolumId, akademikPersonelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bolumKeys.gorevliler(bolumId) }),
  })
}

export function useUnassignGorevli(bolumId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (gorevli: BolumGorevlisi) => bolumGorevliApi.unassign(bolumId, gorevli),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bolumKeys.gorevliler(bolumId) }),
  })
}
