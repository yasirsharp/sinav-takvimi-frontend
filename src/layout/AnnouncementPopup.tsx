import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { ANNOUNCEMENT_TYPES, PRIORITIES, announcementApi } from '../api/announcement'

/**
 * Girişte gösterilecek, kullanıcının henüz okumadığı "açılır pencere" duyuruları. Sırayla gösterilir;
 * "Okudum" denince backend'de okundu işaretlenir ve bir daha gösterilmez.
 */
export default function AnnouncementPopup() {
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState<number[]>([])
  const { data } = useQuery({
    queryKey: ['duyurular', 'popup'],
    queryFn: announcementApi.myPopups,
    staleTime: Infinity,
    retry: false,
  })
  const markRead = useMutation({
    mutationFn: announcementApi.markRead,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['duyurular', 'mine'] }),
  })

  const current = (data ?? []).find((a) => !dismissed.includes(a.id))
  if (!current) return null
  const remaining = (data ?? []).filter((a) => !dismissed.includes(a.id)).length

  const close = (read: boolean) => {
    if (read) markRead.mutate(current.id)
    setDismissed((d) => [...d, current.id])
  }

  const type = ANNOUNCEMENT_TYPES[current.type]
  return (
    <Modal
      open
      title={
        <>
          {current.title} {type && <Tag color={type.color}>{type.label}</Tag>}
          {current.priority > 0 && !(current.type === 'urgent' && current.priority === 2) && <Tag color={current.priority === 2 ? 'red' : 'gold'}>{PRIORITIES[current.priority]}</Tag>}
        </>
      }
      okText={remaining > 1 ? `Okudum (${remaining - 1} duyuru daha)` : 'Okudum'}
      cancelText="Sonra hatırlat"
      onOk={() => close(true)}
      onCancel={() => close(false)}
      mask={{ closable: false }}
    >
      <Typography.Paragraph style={{ whiteSpace: 'pre-line' }}>{current.content}</Typography.Paragraph>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {dayjs(current.publishDate).format('D MMMM YYYY HH:mm')}
        {current.targetBolum ? ` · ${current.targetBolum.ad}` : ''}
      </Typography.Text>
    </Modal>
  )
}
