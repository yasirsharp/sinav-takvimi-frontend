import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'

/** Bölüme atanmış personel (BolumAkademikPersoneller kaydı) */
export interface BolumGorevlisi {
  id: number
  ad: string
  unvan: string
  /** BolumAkademikPersoneller.Id — silmede kullanılır */
  relationshipId: number
}

interface BolumGorevliListesi {
  bolumId: number
  bolumAd: string
  atanmisPersoneller: BolumGorevlisi[] | null
}

/**
 * Not: Backend, bölüme personel atandığında kişiye otomatik olarak "bolum.gorevlisi" rolü verir.
 */
export const bolumGorevliApi = {
  list: async (bolumId: number) => {
    const data = await unwrapData(
      apiClient.get<ApiResult<BolumGorevliListesi>>(`/api/bolumakademikpersoneller/bolum/${bolumId}/personeller`),
    )
    return data?.atanmisPersoneller ?? []
  },
  assign: (bolumId: number, akademikPersonelId: number) =>
    unwrap(apiClient.post<ApiResult<null>>('/api/bolumakademikpersoneller', { bolumId, akademikPersonelId })),
  unassign: (bolumId: number, gorevli: BolumGorevlisi) =>
    unwrap(
      apiClient.delete<ApiResult<null>>('/api/bolumakademikpersoneller', {
        data: { id: gorevli.relationshipId, bolumId, akademikPersonelId: gorevli.id },
      }),
    ),
}
