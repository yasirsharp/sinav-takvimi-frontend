import { App, Button, Popconfirm, Tooltip } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { getErrorMessage } from '../api/errors'

interface DeleteButtonProps {
  /** Onay penceresinde gösterilecek kayıt adı */
  itemName: string
  onDelete: () => Promise<unknown>
  successMessage?: string
}

/** Onay soran silme düğmesi. Backend hata mesajını (ör. ilişkili kayıt var) olduğu gibi gösterir. */
export default function DeleteButton({ itemName, onDelete, successMessage = 'Kayıt silindi.' }: DeleteButtonProps) {
  const { message, modal } = App.useApp()

  const handleConfirm = async () => {
    try {
      await onDelete()
      message.success(successMessage)
    } catch (error) {
      // İlişkili kayıt mesajları uzun ve çok satırlı olabilir; toast yerine pencere ile gösterilir
      modal.error({
        title: 'Silinemedi',
        content: <div style={{ whiteSpace: 'pre-line' }}>{getErrorMessage(error)}</div>,
      })
    }
  }

  return (
    <Popconfirm
      title="Silmek istediğinize emin misiniz?"
      description={<span><strong>{itemName}</strong> kalıcı olarak silinecek.</span>}
      okText="Sil"
      okButtonProps={{ danger: true }}
      cancelText="Vazgeç"
      onConfirm={handleConfirm}
    >
      <Tooltip title="Sil">
        <Button type="text" danger icon={<DeleteOutlined />} aria-label={`${itemName} sil`} />
      </Tooltip>
    </Popconfirm>
  )
}
