import { Result } from 'antd'
import { ToolOutlined } from '@ant-design/icons'

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <Result
      icon={<ToolOutlined />}
      title={title}
      subTitle="Bu ekran bir sonraki geliştirme aşamasında eklenecek."
    />
  )
}
