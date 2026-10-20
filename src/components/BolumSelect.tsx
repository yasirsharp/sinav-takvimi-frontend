import { Select, type SelectProps } from 'antd'
import { useMemo } from 'react'
import { useBolumler } from '../features/bolum/queries'
import { compareTr, matchesSearch } from '../utils/search'

type BolumSelectProps = Omit<SelectProps<number | number[]>, 'options' | 'loading'> & {
  /** Verilirse sadece bu bölümler listelenir (ör. bölüm görevlisinin kendi bölümleri) */
  onlyIds?: readonly number[]
}

/** Bölüm listesinden seçim (tekli veya mode="multiple" ile çoklu). Liste önbellekten gelir. */
export default function BolumSelect({ onlyIds, ...props }: BolumSelectProps) {
  const { data, isLoading } = useBolumler()

  const options = useMemo(
    () =>
      [...(data ?? [])]
        .filter((bolum) => !onlyIds || onlyIds.includes(bolum.id))
        .sort((a, b) => compareTr(a.ad, b.ad))
        .map((bolum) => ({ value: bolum.id, label: bolum.ad })),
    [data, onlyIds],
  )

  return (
    <Select
      showSearch
      allowClear
      loading={isLoading}
      options={options}
      placeholder="Bölüm seçin"
      filterOption={(input, option) => matchesSearch(input, option?.label as string)}
      maxTagCount="responsive"
      {...props}
    />
  )
}
