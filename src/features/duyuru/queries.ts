import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { announcementApi, type AnnouncementValues } from '../../api/announcement'

export const duyuruKeys = {
  all: ['duyurular'] as const,
  manage: ['duyurular', 'manage'] as const,
  mine: ['duyurular', 'mine'] as const,
  popup: ['duyurular', 'popup'] as const,
}

export function useManageDuyurular() {
  return useQuery({ queryKey: duyuruKeys.manage, queryFn: announcementApi.manageList })
}

export function useMyDuyurular() {
  return useQuery({ queryKey: duyuruKeys.mine, queryFn: announcementApi.mine })
}

export function useSaveDuyuru() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: AnnouncementValues }) =>
      id ? announcementApi.update(id, values) : announcementApi.create(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: duyuruKeys.all }),
  })
}

export function useDeleteDuyuru() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: announcementApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: duyuruKeys.all }),
  })
}
