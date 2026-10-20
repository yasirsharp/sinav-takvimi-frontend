import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Empty, Flex, Popover, Spin, Typography } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { notificationApi, type AppNotification } from '../api/notification'
import { brand } from '../theme'

dayjs.extend(relativeTime)

const TYPE_COLORS: Record<string, string> = { info: '#166fc7', success: '#2f9e57', warning: '#d48806', error: '#cf1322' }

/** Üst bardaki bildirim zili: okunmamış sayısı, son bildirimler, okundu işaretleme. 60 sn'de bir yenilenir. */
export default function NotificationBell({ userId, compact }: { userId: number; compact?: boolean }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const key = ['notifications', userId]

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => notificationApi.list(userId),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key })
  const markRead = useMutation({ mutationFn: notificationApi.markRead, onSuccess: invalidate })
  const markAll = useMutation({ mutationFn: () => notificationApi.markAllRead(userId), onSuccess: invalidate })

  const items = useMemo(
    () => [...(data ?? [])].sort((a, b) => dayjs(b.createdDate).valueOf() - dayjs(a.createdDate).valueOf()).slice(0, 20),
    [data],
  )
  const unread = (data ?? []).filter((n) => !n.isRead).length

  const handleClick = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n.id)
    if (n.actionUrl?.startsWith('/')) {
      setOpen(false)
      navigate(n.actionUrl)
    }
  }

  const content = (
    <div style={{ width: 360, maxWidth: '85vw' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Typography.Text strong>Bildirimler</Typography.Text>
        {unread > 0 && (
          <Button type="link" size="small" onClick={() => markAll.mutate()} loading={markAll.isPending}>
            Tümünü okundu say
          </Button>
        )}
      </Flex>
      {isLoading ? (
        <Spin />
      ) : items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bildirim yok" />
      ) : (
        <Flex vertical style={{ maxHeight: 420, overflowY: 'auto' }}>
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleClick(n)}
              className="du-notification"
              style={{
                textAlign: 'left',
                border: 'none',
                borderLeft: `3px solid ${n.isRead ? 'transparent' : (TYPE_COLORS[n.type] ?? brand.navy)}`,
                background: n.isRead ? 'transparent' : '#f3f8fd',
                padding: '8px 10px',
                cursor: 'pointer',
                borderRadius: 4,
                marginBottom: 2,
              }}
            >
              <Flex justify="space-between" gap={8}>
                <Typography.Text strong={!n.isRead}>{n.title}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                  {dayjs(n.createdDate).fromNow()}
                </Typography.Text>
              </Flex>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {n.message}
              </Typography.Text>
            </button>
          ))}
        </Flex>
      )}
    </div>
  )

  return (
    <Popover content={content} trigger="click" placement="bottomRight" open={open} onOpenChange={setOpen}>
      <Badge count={unread} size="small" offset={[-4, 4]}>
        <Button
          shape="circle"
          size={compact ? 'middle' : 'large'}
          icon={<BellOutlined style={{ color: brand.navy }} />}
          aria-label={unread ? `Bildirimler, ${unread} okunmamış` : 'Bildirimler'}
          style={{ borderColor: '#d3d3d3' }}
        />
      </Badge>
    </Popover>
  )
}
