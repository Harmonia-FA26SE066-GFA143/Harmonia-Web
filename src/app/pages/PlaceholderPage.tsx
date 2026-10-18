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
      {/* The build phase (handle.phase) is for the team; people using the app only need to know the page is coming. */}
      <EmptyState icon={<ToolOutlined />} title="Đang phát triển" description="Trang này đang được hoàn thiện." />
    </>
  )
}
