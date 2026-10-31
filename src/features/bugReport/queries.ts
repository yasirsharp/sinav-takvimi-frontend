import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bugReportApi, type BugReportState } from '../../api/bugReport'

export const bugReportKeys = {
  all: ['hata-bildirimleri'] as const,
  list: (state?: BugReportState) => ['hata-bildirimleri', 'list', state ?? 'tum'] as const,
  newCount: ['hata-bildirimleri', 'yeni-sayisi'] as const,
}

export function useBugReports(state?: BugReportState) {
  return useQuery({
    queryKey: bugReportKeys.list(state),
    queryFn: () => bugReportApi.list(state),
  })
}

/** Menüdeki rozet; yalnızca yöneticide istenir */
export function useNewBugReportCount(enabled: boolean) {
  return useQuery({
    queryKey: bugReportKeys.newCount,
    queryFn: bugReportApi.newCount,
    enabled,
    refetchInterval: 120_000,
  })
}

export function useUpdateBugReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, state, adminNote }: { id: number; state: BugReportState; adminNote?: string }) =>
      bugReportApi.updateState(id, state, adminNote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bugReportKeys.all }),
  })
}

export function useDeleteBugReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bugReportApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bugReportKeys.all }),
  })
}
