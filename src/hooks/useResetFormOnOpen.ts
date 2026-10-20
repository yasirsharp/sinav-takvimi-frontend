import { useEffect } from 'react'
import type { FormInstance } from 'antd'

/**
 * Form penceresi her açıldığında alanları güncel initialValues ile doldurur.
 * antd initialValues'ı sadece ilk yüklemede uygular; pencere kapanma animasyonu bitmeden başka bir kayıt
 * için tekrar açılırsa (ör. "ekle"den hemen sonra "düzenle") form eski değerlerle kalıyordu.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useResetFormOnOpen(form: FormInstance<any>, open: boolean, recordKey?: unknown) {
  useEffect(() => {
    if (open) form.resetFields()
  }, [form, open, recordKey])
}
