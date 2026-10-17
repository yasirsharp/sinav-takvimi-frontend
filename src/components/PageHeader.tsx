import type { ReactNode } from 'react'
import { Flex, Typography } from 'antd'
import { brand } from '../theme'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

/** Sayfa başlığı: lacivert başlık, altında turkuaz vurgu çizgisi, sağda eylemler */
export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Flex justify="space-between" align="flex-end" wrap gap={12} style={{ marginBottom: 20 }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0, color: brand.navy }}>
          {title}
        </Typography.Title>
        <div style={{ width: 48, height: 4, borderRadius: 2, background: brand.turquoise, margin: '8px 0' }} />
        {description && <Typography.Text type="secondary">{description}</Typography.Text>}
      </div>
      {actions && <Flex gap={8} wrap>{actions}</Flex>}
    </Flex>
  )
}
