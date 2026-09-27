import { ControlOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { EmptyState, PageHeader } from '@/shared/ui'

/**
 * Admin: general system settings (Report 1 FE-51).
 * Report 1 does not list any concrete setting, so no setting is shown or stored here (TBD). The Stitch
 * "khung dự phòng" groups (parish info, liturgical year, log retention) are not adopted as settings.
 * Loading/error states apply once a settings API exists.
 */
export function SettingsPage() {
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Cấu hình chung"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Cấu hình chung' }]}
        description="Quản lý các thiết lập chung của hệ thống Harmonia."
      />
      <EmptyState
        icon={<ControlOutlined />}
        title="Chưa có mục cấu hình nào được xác định"
        description="Các thiết lập chung sẽ xuất hiện tại đây khi được bổ sung. Danh mục kỹ năng và danh mục phụng vụ được cấu hình ở trang riêng."
        action={
          <>
            <Button onClick={() => navigate(paths.admin.skillCategories)}>Danh mục kỹ năng</Button>
            <Button onClick={() => navigate(paths.admin.liturgicalCategories)}>Danh mục phụng vụ</Button>
          </>
        }
      />
    </>
  )
}
