import { ClearOutlined, FileSearchOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { ReactNode } from 'react'
import { StatePanel } from './StatePanel'

export interface NoFilterResultsProps {
  title?: ReactNode
  description?: ReactNode
  onClearFilters?: () => void
  /** Additional action, e.g. a create button, shown after "Xoá bộ lọc". */
  extra?: ReactNode
}

/** Data exists but the current search/filter matches nothing (distinct from EmptyState). */
export function NoFilterResults({
  title = 'Không tìm thấy kết quả phù hợp',
  description = 'Không có dữ liệu nào khớp với từ khoá hoặc bộ lọc hiện tại. Hãy thử thay đổi hoặc xoá bộ lọc.',
  onClearFilters,
  extra,
}: NoFilterResultsProps) {
  const actions =
    onClearFilters || extra ? (
      <>
        {onClearFilters && (
          <Button icon={<ClearOutlined />} onClick={onClearFilters}>
            Xoá bộ lọc
          </Button>
        )}
        {extra}
      </>
    ) : undefined

  return (
    <StatePanel role="status" icon={<FileSearchOutlined />} title={title} description={description} actions={actions} />
  )
}
