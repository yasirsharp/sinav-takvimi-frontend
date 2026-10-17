import type { ReactNode } from 'react'
import { Flex, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

interface TableToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
  /** Arama kutusunun yanında gösterilecek ek filtreler */
  children?: ReactNode
}

export default function TableToolbar({ search, onSearchChange, placeholder = 'Ara…', children }: TableToolbarProps) {
  return (
    <Flex gap={12} wrap style={{ marginBottom: 16 }}>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder={placeholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ width: 280, maxWidth: '100%' }}
        aria-label="Tabloda ara"
      />
      {children}
    </Flex>
  )
}
