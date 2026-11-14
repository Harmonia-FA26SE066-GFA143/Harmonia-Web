import type { ApiRoleName } from '@/lib/auth/session'
import type { StatusTagColor } from '@/shared/ui'

// Harmonia-BE d74096c: DirectorNominationStatus.cs, DirectorTrainingResult.cs, DirectorNominationDto.cs,
// DirectorNominationStatsDto.cs, DirectorTrainingDto.cs. Enums travel by name.

export type NominationStatus = 'Pending' | 'Approved' | 'InTraining' | 'Trained' | 'Appointed' | 'Rejected' | 'Cancelled'
export type TrainingResult = 'InProgress' | 'Passed' | 'Failed'

export interface NominationStats {
  firstJoinedDate: string | null
  tenureMonths: number
  minTenureMonths: number
  meetsTenure: boolean
  attendanceRecorded: number
  attendancePresent: number
  attendancePercent: number | null
  minAttendancePercent: number
  meetsAttendance: boolean
  servedEventCount: number
  minServedEvents: number
  meetsServedEvents: boolean
  hasConductingSkill: boolean
  isConductingSkillRequired: boolean
  meetsConductingSkill: boolean
  meetsAll: boolean
}

export interface Nomination {
  id: string
  memberId: string
  memberFullName: string
  nominatedById: string
  nominatedByFullName: string
  reason: string
  proposedChoirId: string | null
  proposedChoirName: string | null
  status: NominationStatus
  reviewedAt: string | null
  reviewNote: string | null
  trainingWaiverReason: string | null
  appointedChoirName: string | null
  appointedAt: string | null
  createdAt: string
}

export interface NominationDetail extends Nomination {
  stats: NominationStats
}

export interface Training {
  id: string
  courseName: string
  organizer: string | null
  startDate: string
  endDate: string | null
  result: TrainingResult
  resultNote: string | null
  certificateFileName: string | null
  certificateUrl: string | null
}

export const statusLabels: Record<NominationStatus, string> = {
  Pending: 'Chờ Cha xứ duyệt',
  Approved: 'Đã duyệt',
  InTraining: 'Đang đào tạo',
  Trained: 'Chờ bổ nhiệm',
  Appointed: 'Đã bổ nhiệm',
  Rejected: 'Bị từ chối',
  Cancelled: 'Đã hủy',
}

export const statusColors: Record<NominationStatus, StatusTagColor> = {
  Pending: 'gold',
  Approved: 'blue',
  InTraining: 'processing',
  Trained: 'orange',
  Appointed: 'green',
  Rejected: 'red',
  Cancelled: 'default',
}

export const trainingResultLabels: Record<TrainingResult, string> = { InProgress: 'Đang học', Passed: 'Đạt', Failed: 'Không đạt' }

export type NominationAction = 'withdraw' | 'approve' | 'reject' | 'cancel' | 'waive' | 'startTraining' | 'appoint'

/**
 * What the caller may try on a nomination, from the role and status checks of DirectorNominationsController.cs:45-95
 * and DirectorNominationService / DirectorTrainingService. Only what to show: the server decides.
 */
export function nominationActions(status: NominationStatus, role: ApiRoleName | undefined, isCreator: boolean): NominationAction[] {
  const actions: NominationAction[] = []
  if (status === 'Pending' && isCreator && (role === 'ChoirDirector' || role === 'ParishPriest')) actions.push('withdraw')
  if (role === 'ParishPriest') {
    if (status === 'Pending') actions.push('approve', 'reject')
    if (status === 'Approved') actions.push('waive', 'cancel')
    if (status === 'Approved' || status === 'Trained') actions.push('startTraining')
  }
  if (role === 'Admin' && status === 'Trained') actions.push('appoint')
  return actions
}

/** The usual road, for the progress line; Rejected and Cancelled leave it and are shown as an end. */
export const nominationSteps: { status: NominationStatus; title: string }[] = [
  { status: 'Pending', title: 'Đề cử' },
  { status: 'Approved', title: 'Cha xứ duyệt' },
  { status: 'InTraining', title: 'Đào tạo' },
  { status: 'Trained', title: 'Đào tạo xong hoặc được miễn' },
  { status: 'Appointed', title: 'Bổ nhiệm' },
]
