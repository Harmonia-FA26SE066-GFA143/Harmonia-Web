import { BulbOutlined, LockOutlined, NotificationOutlined } from '@ant-design/icons'
import { Alert, App, Button, Flex, Tag, Tooltip, Typography } from 'antd'
import { useState } from 'react'
import { ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { useFinalizeRoster, useRoster, useSendRosterNotifications, useShortages, useSuggestRoster } from '../hooks/useRoster'
import { rosterErrorMessage } from '../rosterErrors'
import { rosterStatusLabels, type EligibleMember } from '../types'
import { NotifyModal } from './NotifyModal'
import { SongStaffingCard, type RosterSong } from './SongStaffingCard'

export interface RosterPanelProps {
  programId: string
  /** Songs of the approved list, in order. */
  songs: RosterSong[]
  eligible: EligibleMember[]
  skills: { id: string; name: string }[]
}

const statusColors = { draft: 'default', suggested: 'blue', finalized: 'green' } as const

/**
 * The roster of one program (FE-35–FE-40), following Harmonia-BE: requirements per song, suggestion (FE-36),
 * shortages computed by the backend (FE-37), manual lines (FE-38), finalization that locks everything (FE-39) and
 * the assignment notification, sent only once finalized (FE-40).
 */
export function RosterPanel({ programId, songs, eligible, skills }: RosterPanelProps) {
  const { message, modal } = App.useApp()
  const roster = useRoster(programId)
  const shortages = useShortages(programId)
  const suggest = useSuggestRoster(programId)
  const finalize = useFinalizeRoster(programId)
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
  const assignedMembers = [
    ...new Map((current?.assignments ?? []).map((line) => [line.memberId, { memberId: line.memberId, fullName: line.memberName }])).values(),
  ]
  const failed = (fallback: string) => (error: Error) => message.error(rosterErrorMessage(error, fallback))

  const runSuggestion = () =>
    suggest.mutate(undefined, {
      onSuccess: ({ isAiGenerated }) =>
        message.success(isAiGenerated ? 'Đã gợi ý phân công.' : 'Đã gợi ý phân công theo quy tắc dự phòng của hệ thống.'),
      onError: failed('Không thể gợi ý phân công. Vui lòng thử lại.'),
    })
  const handleSuggest = () =>
    current?.assignments.some((line) => line.source === 'suggested')
      ? modal.confirm({
          title: 'Gợi ý lại phân công?',
          content: 'Các dòng gợi ý trước sẽ được thay bằng gợi ý mới; các dòng bạn tự thêm được giữ nguyên.',
          okText: 'Gợi ý lại',
          cancelText: 'Hủy',
          onOk: runSuggestion,
        })
      : runSuggestion()

  const handleFinalize = () => {
    if (!current) return
    const short = shortages.data.length
    modal.confirm({
      title: 'Chốt phân công?',
      content: `${short ? `Còn ${short} vị trí thiếu người. ` : ''}Sau khi chốt, yêu cầu nhân sự và phân công không thể thay đổi.`,
      okText: 'Chốt phân công',
      cancelText: 'Hủy',
      onOk: () =>
        finalize
          .mutateAsync(current.id)
          .then(() => message.success('Đã chốt phân công.'))
          .catch(failed('Không thể chốt phân công. Vui lòng thử lại.')),
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
            <Tag color={statusColors[current.status]} style={{ marginInlineEnd: 0 }}>
              {rosterStatusLabels[current.status]}
            </Tag>
          ) : (
            <Typography.Text style={{ color: colors.textMuted }}>Chưa có</Typography.Text>
          )}
        </Flex>
        <Flex wrap gap={spacing.sm}>
          <Button icon={<BulbOutlined />} onClick={handleSuggest} disabled={locked} loading={suggest.isPending}>
            Gợi ý phân công
          </Button>
          <Button icon={<LockOutlined />} onClick={handleFinalize} disabled={!current || locked}>
            Chốt phân công
          </Button>
          <Tooltip title={locked ? undefined : 'Chốt phân công trước khi gửi thông báo.'}>
            <Button
              icon={<NotificationOutlined />}
              onClick={() => setNotifying(true)}
              disabled={!locked || assignedMembers.length === 0}
            >
              Gửi thông báo phân công
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
      {locked && <Alert type="success" showIcon title="Phân công đã chốt. Yêu cầu nhân sự và phân công chỉ còn xem." />}
      {shortages.data.length > 0 && (
        <Alert
          type="warning"
          showIcon
          title={`Còn thiếu người ở ${shortages.data.length} vị trí`}
          description={
            <ul style={{ margin: 0, paddingInlineStart: 18 }}>
              {shortages.data.map((item) => (
                <li key={`${item.songListItemId}-${item.skillId}`}>
                  {item.songTitle}: thiếu {item.requiredCount - item.assignedCount} {item.skillName}
                </li>
              ))}
            </ul>
          }
        />
      )}
      {songs.map((song) => (
        <SongStaffingCard
          key={song.id}
          programId={programId}
          song={song}
          assignments={(current?.assignments ?? []).filter((line) => line.songListItemId === song.id)}
          shortages={shortages.data.filter((item) => item.songListItemId === song.id)}
          eligible={eligible}
          skills={skills}
          locked={locked}
        />
      ))}
      <NotifyModal
        open={notifying}
        members={assignedMembers}
        sending={notify.isPending}
        onSend={handleNotify}
        onCancel={() => setNotifying(false)}
      />
    </Flex>
  )
}
