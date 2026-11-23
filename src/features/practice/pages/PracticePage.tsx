import { Button, Flex, Tabs, Typography } from 'antd'
import { generatePath, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate } from '@/features/liturgical-programs'
import { useUrlTab } from '@/shared/hooks/useUrlTab'
import {
  CREATE_ASSIGNMENT_LABEL,
  Icon,
  PageHeader,
  PRACTICE_AREA_LABEL,
  PRACTICE_ASSIGNMENTS_TAB_LABEL,
  PRACTICE_READINESS_TAB_LABEL,
  PRACTICE_REVIEW_TAB_LABEL,
  PROGRAM_NOUN,
} from '@/shared/ui'
import { spacing } from '@/styles/tokens'
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
  const location = useLocation()
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

  const assignmentParams = new URLSearchParams(params)
  assignmentParams.delete('tab')
  const assignmentSearch = assignmentParams.toString()
  const assignmentUrl = `${paths.director.practiceNew}${assignmentSearch ? `?${assignmentSearch}` : ''}`

  // Keep old links working while making "Giao bài tập" one focused route instead of a tab that becomes another page.
  if (tab === 'assign') {
    return <Navigate replace to={assignmentUrl} state={{ from: paths.director.practice }} />
  }

  return (
    <>
      <PageHeader
        title={PRACTICE_AREA_LABEL}
        breadcrumb={[{ title: 'Ca trưởng' }, { title: PRACTICE_AREA_LABEL }]}
        description="Chấm bản thu đang chờ, xem bài tập đã giao và theo dõi tiến độ chuẩn bị."
        extra={
          <>
            {activeEvent && (
              <Button
                icon={<Icon name="arrow-left" />}
                onClick={() => navigate(generatePath(paths.director.programDetail, { programId: activeEvent.id }))}
              >
                Về chi tiết chương trình
              </Button>
            )}
            <Button
              type="primary"
              icon={<Icon name="add" />}
              onClick={() => navigate(assignmentUrl, { state: { from: `${location.pathname}${location.search}` } })}
            >
              {CREATE_ASSIGNMENT_LABEL}
            </Button>
          </>
        }
      />
      {activeEvent && (
        <Flex wrap align="center" justify="space-between" gap={spacing.sm} className="hm-context-banner" role="region" aria-label="Chương trình đang chọn">
          <Typography.Text>
            Đang chuẩn bị luyện tập cho chương trình:{' '}
            <strong>{activeEvent.title || PROGRAM_NOUN}</strong> · {formatProgramDate(activeEvent.eventDate)} ({activeEvent.locationName})
          </Typography.Text>
          <Button type="link" size="small" onClick={clearEventContext} style={{ padding: 0 }} aria-label="Xem tất cả chương trình (bỏ lọc ngữ cảnh)">
            Xem tất cả chương trình
          </Button>
        </Flex>
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
                {PRACTICE_REVIEW_TAB_LABEL}
                {waitingCount ? <span className="ctb-tab-count">{waitingCount}</span> : null}
              </span>
            ),
            children: <SubmissionList defaultStatus="submitted" />,
          },
          { key: 'assignments', label: PRACTICE_ASSIGNMENTS_TAB_LABEL, children: <AssignmentsTab /> },
          { key: 'progress', label: PRACTICE_READINESS_TAB_LABEL, children: <ProgressTab /> },
        ]}
      />
    </>
  )
}
