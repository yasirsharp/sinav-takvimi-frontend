import { Tooltip, Typography } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { SCOPE_LOCK_HINT } from '../hooks/useBolumScope'

/** Bölüm görevlisinin değiştiremediği satırda işlem düğmeleri yerine gösterilir */
export default function ScopeLock() {
  return (
    <Tooltip title={SCOPE_LOCK_HINT}>
      <Typography.Text type="secondary" aria-label={SCOPE_LOCK_HINT} style={{ padding: '0 8px' }}>
        <LockOutlined />
      </Typography.Text>
    </Tooltip>
  )
}
