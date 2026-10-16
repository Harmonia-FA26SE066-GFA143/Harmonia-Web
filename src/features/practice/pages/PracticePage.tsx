import { Tabs } from 'antd'
import { PageHeader } from '@/shared/ui'
import { AssignmentForm } from '../components/AssignmentForm'
import { AssignmentsTab } from '../components/AssignmentsTab'
import { ProgressTab } from '../components/ProgressTab'
import { SubmissionList } from '../components/SubmissionList'

/**
 * Choir Director: practice (FE-41–FE-44) as Harmonia-BE offers it (owner choice 2026-10-10). "Chấm bài" is the review
 * queue across every assignment, each member's newest attempt; "Bài đã giao" lists the assignments given with their
 * submissions; "Giao bài" gives a new assignment; "Tiến độ" shows each member's readiness for an upcoming event (FE-46).
 */
export function PracticePage() {
  return (
    <>
      <PageHeader
        title="Bài tập & Tiến độ luyện tập"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Luyện tập' }]}
        description="Nghe và chấm bản thu ca viên nộp trên ứng dụng di động, giao bài tập mới và theo dõi tiến độ chuẩn bị của ca viên."
      />
      <Tabs
        destroyOnHidden
        items={[
          { key: 'review', label: 'Chấm bài', children: <SubmissionList defaultStatus="submitted" /> },
          { key: 'assignments', label: 'Bài đã giao', children: <AssignmentsTab /> },
          { key: 'assign', label: 'Giao bài', children: <AssignmentForm /> },
          { key: 'progress', label: 'Tiến độ', children: <ProgressTab /> },
        ]}
      />
    </>
  )
}
