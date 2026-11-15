import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Tabs, Typography } from 'antd'
import { generatePath, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate } from '@/features/liturgical-programs'
import { useUrlTab } from '@/shared/hooks/useUrlTab'
import { PageHeader } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { AssignmentForm } from '../components/AssignmentForm'
import { AssignmentsTab } from '../components/AssignmentsTab'
import { ProgressTab } from '../components/ProgressTab'
import { SubmissionList } from '../components/SubmissionList'
import { useSubmissions, useUpcomingEvents } from '../hooks/usePractice'

/**
 * Choir Director: practice (FE-41–FE-44) as Harmonia-BE offers it (owner choice 2026-10-10). "Chấm bài" is the review
 * queue across every assignment, each member's newest attempt; "Bài đã giao" lists the assignments given with their
 * submissions; "Giao bài" gives a new assignment; "Tiến độ" shows each member's readiness for an upcoming event (FE-46).
 * Preselects progress and event context when arriving with `?programId=`.
 */
export function PracticePage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const programId = params.get('programId') ?? params.get('eventId')
  const defaultTab = programId ? 'progress' : 'review'
  const [tab, setTab] = useUrlTab(['review', 'assignments', 'assign', 'progress'], defaultTab)

  const events = useUpcomingEvents()
  // Same query as the review queue's first page, so the tab count costs no extra request.
  const waiting = useSubmissions('submitted', { pageNumber: 1, pageSize: 20 })
  const waitingCount = waiting.data?.totalCount
  const activeEvent = programId ? (events.data ?? []).find((event) => event.id === programId) : undefined

  const clearEventContext = () => {
    const next = new URLSearchParams(params)
    next.delete('programId')
    next.delete('eventId')
    setParams(next, { replace: true })
  }

  // Giao bài tập is its own page (artifact AssignPracticePage), kept on `?tab=assign` so existing links still land on it.
  if (tab === 'assign') {
    return (
      <>
        <PageHeader
          title="Giao bài tập"
          breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Luyện tập' }, { title: 'Giao bài tập' }]}
          description="Ca viên sẽ nhận được thông báo khi bạn giao bài."
          extra={
            <Button icon={<ArrowLeftOutlined />} onClick={() => setTab('assignments')}>
              Về Luyện tập
            </Button>
          }
        />
        <AssignmentForm />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Luyện tập"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Luyện tập' }]}
        extra={
          <>
            {activeEvent && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(generatePath(paths.director.programDetail, { programId: activeEvent.id }))}
              >
                Về chi tiết chương trình
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTab('assign')}>
              Giao bài tập
            </Button>
          </>
        }
      />
      {activeEvent && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: spacing.md }}
          title={
            <Flex wrap align="center" justify="space-between" gap={spacing.sm}>
              <Typography.Text>
                Đang chuẩn bị luyện tập cho chương trình:{' '}
                <strong>{activeEvent.title || 'Sự kiện phụng vụ'}</strong> · {formatProgramDate(activeEvent.eventDate)} ({activeEvent.locationName})
              </Typography.Text>
              <Button type="link" size="small" onClick={clearEventContext} style={{ padding: 0 }}>
                Xem tất cả sự kiện
              </Button>
            </Flex>
          }
        />
      )}
      <Tabs
        destroyOnHidden
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'review',
            label: (
              <span>
                Chấm bài{waitingCount ? <span className="ctb-tab-count">{waitingCount}</span> : null}
              </span>
            ),
            children: <SubmissionList defaultStatus="submitted" />,
          },
          { key: 'assignments', label: 'Bài đã giao', children: <AssignmentsTab /> },
          { key: 'progress', label: 'Tiến độ', children: <ProgressTab /> },
        ]}
      />
    </>
  )
}
