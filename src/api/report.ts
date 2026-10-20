import { apiClient } from './client'

export type ReportType = 'official-sinav-report' | 'gozetmen-assignment-report' | 'derslik-usage-report'

/** Backend'in ürettiği PDF raporu indirir ve tarayıcıda kaydetme işlemini başlatır */
export async function downloadReport(
  type: ReportType,
  params: { startDate: string; endDate: string; bolumIds?: number[] },
  fileName: string,
) {
  const response = await apiClient.get<Blob>(`/api/Report/${type}`, {
    params: {
      startDate: params.startDate,
      endDate: params.endDate,
      bolumIds: params.bolumIds?.length ? params.bolumIds.join(',') : undefined,
    },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
