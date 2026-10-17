import type { TablePaginationConfig } from 'antd'

/** Tüm tanım tablolarında ortak sayfalama ayarı */
export const defaultPagination: TablePaginationConfig = {
  defaultPageSize: 10,
  showSizeChanger: true,
  pageSizeOptions: [10, 20, 50],
  showTotal: (total) => `Toplam ${total} kayıt`,
}
