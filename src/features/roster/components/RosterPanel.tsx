import { BulbOutlined, LockOutlined, NotificationOutlined, SoundOutlined } from '@ant-design/icons'
import { Alert, App, Button, Flex, Tooltip, Typography } from 'antd'
import { useState, type ReactNode } from 'react'
import { formatDateTime } from '@/lib/api/dates'
import { ErrorState, SectionSkeleton, StatusTag } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import {
  useFinalizeRoster,
  useFinalizeWholeService,
  usePersonnelRequirements,
  useRoster,
  useSendRosterNotifications,
  useShortages,
  useSuggestRoster,
} from '../hooks/useRoster'
import { rosterErrorMessage } from '../rosterErrors'
import { rosterStatusLabels, type EligibleMember, type RosterAssignment } from '../types'
import { NotifyDrawer } from './NotifyDrawer'
import { StaffingCard, type RosterSong } from './StaffingCard'

export interface RosterPanelProps {
  programId: string
  /** The song list is approved: song positions open, and the whole roster can be finalized. */
  approved: boolean
  /** Songs of the approved list, in order; empty until it is approved. */
  songs: RosterSong[]
  /** Shown instead of the songs while the list is not approved. */
  songListNotice?: ReactNode
  eligible: EligibleMember[]
  skills: { id: string; name: string }[]
}

const statusColors = { draft: 'default', suggested: 'blue', finalized: 'green' } as const

const uniqueMembers = (lines: RosterAssignment[]) => [
  ...new Map(lines.map((line) => [line.memberId, { memberId: line.memberId, fullName: line.memberName }])).values(),
]

/**
 * The roster of one program (FE-35–FE-40), in Harmonia-BE's three tiers (BE d1ca63e): choral singing needs no line,
 * whole-service roles are staffed once (and may be finalized and announced early), song roles per song of the approved
 * list. Suggestion (FE-36), shortages computed by the backend (FE-37), manual lines (FE-38), finalization that locks
 * everything (FE-39) and the assignment notification (FE-40).
 */
export function RosterPanel({ programId, approved, songs, songListNotice, eligible, skills }: Readonly<RosterPanelProps>) {
  const { message, modal } = App.useApp()
  const roster = useRoster(programId)
  const shortages = useShortages(programId)
  const wholeService = usePersonnelRequirements(programId)
  const suggest = useSuggestRoster(programId)
  const finalize = useFinalizeRoster(programId)
  const finalizeWholeService = useFinalizeWholeService(programId)
  const notify = useSendRosterNotifications()
  const [notifying, setNotifying] = useState(false)

  if (roster.isPending || shortages.isPending) return <SectionSkeleton rows={8} label="Đang tải phân công" />
  if (roster.isError || shortages.isError) {
    return (
      <ErrorState
        title="Không thể tải phân công"
        onRetry={() => [roster, shortages].forEach((query) => query.isError && query.refetch())}
      />
    )
  }

  const current = roster.data
  const locked = current?.status === 'finalized'
  const wholeServiceLocked = Boolean(current?.wholeServiceFinalizedAt)
  const lines = current?.assignments ?? []
  const wholeServiceLines = lines.filter((line) => line.songListItemId === null)
  const songLines = lines.filter((line) => line.songListItemId !== null)
  const wholeServiceCounts = new Map((wholeService.data ?? []).map((row) => [row.skillId, row.requiredCount]))
  // Before the full finalization only the whole-service lines may be announced.
  const announceable = uniqueMembers(locked ? lines : wholeServiceLines)
  const failed = (fallback: string) => (error: Error) => message.error(rosterErrorMessage(error, fallback))

  const runSuggestion = () =>
    suggest.mutate(undefined, {
      onSuccess: ({ isAiGenerated }) =>
        message.success(isAiGenerated ? 'Đã gợi ý phân công.' : 'Đã gợi ý phân công theo quy tắc dự phòng của hệ thống.'),
      onError: failed('Không thể gợi ý phân công. Vui lòng thử lại.'),
    })
  const handleSuggest = () =>
    lines.some((line) => line.source === 'suggested')
      ? modal.confirm({
          title: 'Gợi ý lại phân công?',
          content: 'Các dòng gợi ý trước sẽ được thay bằng gợi ý mới; các dòng bạn tự thêm và các dòng nhạc công đã chốt được giữ nguyên.',
          okText: 'Gợi ý lại',
          cancelText: 'Hủy',
          onOk: runSuggestion,
        })
      : runSuggestion()

  const handleFinalize = () => {
    if (!current) return
    const short = shortages.data.length
    const shortNote = short ? `Còn ${short} vị trí thiếu người. ` : ''
    modal.confirm({
      title: 'Chốt phân công?',
      content: `${shortNote}Sau khi chốt, yêu cầu nhân sự và phân công không thể thay đổi.`,
      okText: 'Chốt phân công',
      cancelText: 'Hủy',
      onOk: () =>
        finalize
          .mutateAsync(current.id)
          .then(() => message.success('Đã chốt phân công.'))
          .catch(failed('Không thể chốt phân công. Vui lòng thử lại.')),
    })
  }

  const handleFinalizeWholeService = () => {
    if (!current) return
    const short = shortages.data.filter((item) => item.songListItemId === null).length
    modal.confirm({
      title: 'Chốt nhạc công?',
      content: `${short ? `Cả buổi lễ còn ${short} vai thiếu người. ` : ''}Sau khi chốt, vai cả buổi lễ chỉ còn thay người được, và bạn gửi được thông báo cho họ ngay, trước khi danh sách bài được duyệt.`,
      okText: 'Chốt nhạc công',
      cancelText: 'Hủy',
      onOk: () =>
        finalizeWholeService
          .mutateAsync(current.id)
          .then(() => message.success('Đã chốt nhạc công.'))
          .catch(failed('Không thể chốt nhạc công. Vui lòng thử lại.')),
    })
  }

  const handleNotify = (memberIds: string[]) => {
    if (!current) return
    notify.mutate(
      { rosterId: current.id, memberIds },
      {
        onSuccess: () => {
          message.success(`Đã gửi thông báo phân công cho ${memberIds.length} thành viên.`)
          setNotifying(false)
        },
        onError: failed('Không thể gửi thông báo. Vui lòng thử lại.'),
      },
    )
  }

  return (
    <Flex vertical gap={spacing.md}>
      <Flex wrap gap={spacing.sm} align="center" justify="space-between">
        <Flex gap={spacing.xs} align="center">
          <Typography.Text style={{ color: colors.textMuted }}>Phân công:</Typography.Text>
          {current ? (
            <StatusTag color={statusColors[current.status]} style={{ marginInlineEnd: 0 }}>
              {rosterStatusLabels[current.status]}
            </StatusTag>
          ) : (
            <Typography.Text style={{ color: colors.textMuted }}>Chưa có</Typography.Text>
          )}
        </Flex>
        <Flex wrap gap={spacing.sm}>
          <Button icon={<BulbOutlined />} onClick={handleSuggest} disabled={locked} loading={suggest.isPending}>
            Gợi ý phân công
          </Button>
          {(wholeService.data?.length ?? 0) > 0 && (
            <Button
              icon={<SoundOutlined />}
              onClick={handleFinalizeWholeService}
              disabled={!current || locked || wholeServiceLocked || wholeServiceLines.length === 0}
            >
              Chốt nhạc công
            </Button>
          )}
          <Tooltip title={approved ? undefined : 'Chốt phân công được sau khi danh sách bài hát được duyệt.'}>
            <Button icon={<LockOutlined />} onClick={handleFinalize} disabled={!current || locked || !approved}>
              Chốt phân công
            </Button>
          </Tooltip>
          <Tooltip title={locked || wholeServiceLocked ? undefined : 'Chốt phân công (hoặc chốt nhạc công) trước khi gửi thông báo.'}>
            <Button
              icon={<NotificationOutlined />}
              onClick={() => setNotifying(true)}
              disabled={!(locked || wholeServiceLocked) || announceable.length === 0}
            >
              Gửi thông báo phân công
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
      {locked && <Alert type="success" showIcon title="Phân công đã chốt. Yêu cầu nhân sự và phân công chỉ còn xem." />}
      {!locked && wholeServiceLocked && current?.wholeServiceFinalizedAt && (
        <Alert
          type="info"
          showIcon
          title={`Đã chốt nhạc công lúc ${formatDateTime(current.wholeServiceFinalizedAt)}.`}
          description="Vai cả buổi lễ chỉ còn thay người được; gửi thông báo được cho họ ngay. Phần theo bài vẫn sửa được."
        />
      )}
      {shortages.data.length > 0 && (
        <Alert
          type="warning"
          showIcon
          title={`Còn thiếu người ở ${shortages.data.length} vị trí`}
          description={
            <ul style={{ margin: 0, paddingInlineStart: 18 }}>
              {shortages.data.map((item) => (
                <li key={`${item.songListItemId ?? 'whole-service'}-${item.skillId}`}>
                  {item.songTitle ?? 'Cả buổi lễ'}: thiếu {item.requiredCount - item.assignedCount} {item.skillName}
                </li>
              ))}
            </ul>
          }
        />
      )}
      <StaffingCard
        programId={programId}
        assignments={wholeServiceLines}
        otherLines={songLines}
        shortages={shortages.data.filter((item) => item.songListItemId === null)}
        eligible={eligible}
        skills={skills}
        locked={locked}
        linesLocked={wholeServiceLocked}
      />
      {approved
        ? songs.map((song) => (
            <StaffingCard
              key={song.id}
              programId={programId}
              song={song}
              assignments={songLines.filter((line) => line.songListItemId === song.id)}
              otherLines={wholeServiceLines}
              shortages={shortages.data.filter((item) => item.songListItemId === song.id)}
              wholeServiceCounts={wholeServiceCounts}
              eligible={eligible}
              skills={skills}
              locked={locked}
            />
          ))
        : songListNotice}
      <NotifyDrawer
        open={notifying}
        members={announceable}
        sending={notify.isPending}
        onSend={handleNotify}
        onCancel={() => setNotifying(false)}
      />
    </Flex>
  )
}
