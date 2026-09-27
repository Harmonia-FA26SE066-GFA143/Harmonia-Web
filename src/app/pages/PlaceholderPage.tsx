import { ToolOutlined } from '@ant-design/icons'
import { useMatches } from 'react-router'
import { isPageHandle } from '@/app/router/placeholderRoute'
import { EmptyState, PageHeader } from '@/shared/ui'

/** Stand-in for pages that are routed but not yet implemented. */
export function PlaceholderPage() {
  const handle = useMatches()
    .map((match) => match.handle)
    .findLast(isPageHandle)

  if (!handle) return null

  return (
    <>
      <PageHeader title={handle.title} breadcrumb={handle.breadcrumb?.map((title) => ({ title }))} />
      <EmptyState
        icon={<ToolOutlined />}
        title="Đang phát triển"
        description={
          handle.phase === 'TBD'
            ? 'Màn hình này chưa được xếp vào phase triển khai nào.'
            : `Màn hình này sẽ được dựng ở Phase ${handle.phase}.`
        }
      />
    </>
  )
}
