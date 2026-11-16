import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useLocation, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { PageHeader } from '@/shared/ui'
import { AssignmentForm } from '../components/AssignmentForm'

interface AssignmentLocationState {
  from?: string
}

/** A focused route for giving one assignment; legacy `?tab=assign` links redirect here from PracticePage. */
export function AssignmentCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as AssignmentLocationState | null)?.from ?? paths.director.practice
  const leave = () => navigate(from)

  return (
    <>
      <PageHeader
        title="Giao bài tập"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Luyện tập' }, { title: 'Giao bài tập' }]}
        description="Chọn ngữ cảnh, nội dung và người nhận; kiểm tra lại trước khi giao."
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={leave}>
            Quay lại
          </Button>
        }
      />
      <AssignmentForm
        onCancel={leave}
        onCreated={(title) => navigate(`${paths.director.practice}?tab=assignments`, { state: { createdTitle: title } })}
      />
    </>
  )
}
