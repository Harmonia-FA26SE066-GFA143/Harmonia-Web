import { Alert, App, Button, Flex, Segmented, Select, Tooltip, Typography } from 'antd'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { formatDateTime } from '@/lib/api/dates'
import { CANCEL_LABEL, ErrorState, Icon, SectionSkeleton, SELECT_POPUP_PROPS, StatusTag, UNKNOWN_METRIC_LABEL, voicePartName } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import {
  useFinalizeRoster,
  useFinalizeWholeService,
  usePersonnelRequirements,
  useRoster,
  useSendRosterNotifications,
  useShortages,
  useSongRequirements,
  useSuggestRoster,
} from '../hooks/useRoster'
import { ApiError } from '@/lib/api/errors'
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
  /** The page head, given the roster actions and status tag. */
  head: (actions?: ReactNode, tags?: ReactNode) => ReactNode
  /** The Mass picker, first in the filter row. */
  picker: ReactNode
  /** Past program or non-lead director: read-only roster. */
  readOnly?: boolean
  /** Notices shown between the head and the roster. */
  children?: ReactNode
}

const statusColors = { draft: 'default', suggested: 'blue', finalized: 'green' } as const

const uniqueMembers = (lines: RosterAssignment[]) => [
  ...new Map(lines.map((line) => [line.memberId, { memberId: line.memberId, fullName: line.memberName }])).values(),
]

function formatFinalizeError(error: Error, lines: RosterAssignment[], songs: RosterSong[], fallback: string) {
  const detail = error instanceof ApiError ? (error.body as { message?: unknown } | null)?.message : undefined
  const id = typeof detail === 'string' ? /Assignment ([0-9a-f-]{36})/i.exec(detail)?.[1] : undefined
  const line = id ? lines.find((item) => item.id === id) : undefined
  const text = rosterErrorMessage(error, fallback)
  if (!line) return { content: text, duration: undefined }
  const song = line.songListItemId ? songs.find((item) => item.id === line.songListItemId)?.title : undefined
  // A whole-service line has no song; a song line whose song is no longer listed names the member and skill only.
  const place = line.songListItemId ? song : 'cả buổi lễ'
  const where = [line.memberName, line.skillName, place].filter(Boolean).join(' · ')
  return { content: `${text} Dòng cần sửa: ${where}.`, duration: 8 }
}

function resolveStaffingStatus(params: {
  reqsPending: boolean
  reqsError: boolean
  declaredCount: number
  linesLength: number
  shortCount: number
}): { text: string; style?: CSSProperties } {
  const { reqsPending, reqsError, declaredCount, linesLength, shortCount } = params
  if (shortCount > 0) {
    return {
      text: `${shortCount} vị trí còn thiếu`,
      style: { color: 'var(--hm-area-attention-ink)', fontWeight: 600 },
    }
  }
  if (reqsPending) return { text: 'Đang kiểm tra yêu cầu…', style: { color: colors.textMuted } }
  if (reqsError) return { text: UNKNOWN_METRIC_LABEL, style: { color: colors.textMuted } }
  if (declaredCount === 0 && linesLength === 0) return { text: 'Chưa khai báo yêu cầu vị trí', style: { color: colors.textMuted } }
  return { text: 'Đủ người cho mọi vị trí đã khai' }
}

/**
 * The roster of one program (FE-35–FE-40), in Harmonia-BE's three tiers (BE d1ca63e): choral singing needs no line,
 * whole-service roles are staffed once (and may be finalized and announced early), song roles per song of the approved
 * list. Suggestion (FE-36), shortages computed by the backend (FE-37), manual lines (FE-38), finalization that locks
 * everything (FE-39) and the assignment notification (FE-40).
 */
export function RosterPanel({ programId, approved, songs, songListNotice, eligible, skills, head, picker, readOnly = false, children }: Readonly<RosterPanelProps>) {
  const { message, modal } = App.useApp()
  const roster = useRoster(programId)
  const shortages = useShortages(programId)
  const wholeService = usePersonnelRequirements(programId)
  // Same queries as each song's StaffingCard (shared cache): needed to tell "nothing declared" from "all staffed" (G4-10).
  const songRequirements = useSongRequirements(programId, approved ? songs.map((song) => song.id) : [])
  const suggest = useSuggestRoster(programId)
  const finalize = useFinalizeRoster(programId)
  const finalizeWholeService = useFinalizeWholeService(programId)
  const notify = useSendRosterNotifications()
  const [notifying, setNotifying] = useState(false)
  // One scope at a time: the whole service, or one song of the approved list.
  const [songId, setSongId] = useState<string>()
  const [cardDirty, setCardDirty] = useState(false)

  const switchSong = (nextSongId: string | undefined) => {
    if (nextSongId === songId) return
    if (!cardDirty) {
      setSongId(nextSongId)
      return
    }
    modal.confirm({
      title: 'Bỏ thay đổi yêu cầu nhân sự chưa lưu?',
      content: 'Yêu cầu nhân sự bạn vừa chỉnh sửa sẽ mất nếu chuyển sang phần khác.',
      okText: 'Bỏ thay đổi',
      okButtonProps: { danger: true },
      cancelText: 'Ở lại',
      focusable: { autoFocusButton: 'cancel' },
      onOk: () => {
        setCardDirty(false)
        setSongId(nextSongId)
      },
    })
  }

  if (roster.isPending || shortages.isPending || roster.isError || shortages.isError) {
    return (
      <>
        {head()}
        <Flex vertical gap={spacing.lg}>
          <div className="ctb-filters">{picker}</div>
          {children}
          {roster.isPending || shortages.isPending ? (
            <SectionSkeleton rows={8} label="Đang tải phân công" />
          ) : (
            <ErrorState title="Không thể tải phân công" onRetry={() => [roster, shortages].forEach((query) => query.isError && query.refetch())} />
          )}
        </Flex>
      </>
    )
  }

  const current = roster.data
  const pickedSong = approved ? songs.find((song) => song.id === songId) : undefined
  const scope = pickedSong ? 'song' : 'service'
  const locked = current?.status === 'finalized'
  const effectiveLocked = locked || readOnly
  const wholeServiceLocked = Boolean(current?.wholeServiceFinalizedAt)
  const lines = current?.assignments ?? []
  const wholeServiceLines = lines.filter((line) => line.songListItemId === null)
  const songLines = lines.filter((line) => line.songListItemId !== null)
  const wholeServiceCounts = new Map((wholeService.data ?? []).map((row) => [row.skillId, row.requiredCount]))
  // Before the full finalization only the whole-service lines may be announced.
  const announceable = uniqueMembers(locked ? lines : wholeServiceLines)
  const failed = (fallback: string) => (error: Error) => message.error(rosterErrorMessage(error, fallback))
  // The backend stops at the first line that is no longer valid and names it in the message only:
  // "Assignment {id} is no longer valid." (RosterService.FinalizeAsync). Say who and where.
  const finalizeFailed = (fallback: string) => (error: Error) => {
    const formatted = formatFinalizeError(error, lines, songs, fallback)
    if (formatted.duration) message.error({ duration: formatted.duration, content: formatted.content })
    else message.error(formatted.content)
  }

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
          cancelText: CANCEL_LABEL,
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
      cancelText: CANCEL_LABEL,
      onOk: () =>
        finalize
          .mutateAsync(current.id)
          .then(() => message.success('Đã chốt phân công.'))
          .catch(finalizeFailed('Không thể chốt phân công. Vui lòng thử lại.')),
    })
  }

  const handleFinalizeWholeService = () => {
    if (!current) return
    const short = shortages.data.filter((item) => item.songListItemId === null).length
    modal.confirm({
      title: 'Chốt nhạc công?',
      content: `${short ? `Cả buổi lễ còn ${short} vai thiếu người. ` : ''}Sau khi chốt, vai cả buổi lễ chỉ còn thay người được, và bạn gửi được thông báo cho họ ngay, trước khi danh sách bài được duyệt.`,
      okText: 'Chốt nhạc công',
      cancelText: CANCEL_LABEL,
      onOk: () =>
        finalizeWholeService
          .mutateAsync(current.id)
          .then(() => message.success('Đã chốt nhạc công.'))
          .catch(finalizeFailed('Không thể chốt nhạc công. Vui lòng thử lại.')),
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

  const reqsPending = wholeService.isPending || songRequirements.some((query) => query.isPending)
  const reqsError = wholeService.isError || songRequirements.some((query) => query.isError)
  const declaredCount = (wholeService.data?.length ?? 0) + songRequirements.reduce((sum, query) => sum + (query.data?.length ?? 0), 0)
  // Never claim "all staffed" while requirements load, failed, or none were declared (G4-10, R2.6).
  const { text: staffingStatus, style: staffingStatusStyle } = resolveStaffingStatus({
    reqsPending,
    reqsError,
    declaredCount,
    linesLength: lines.length,
    shortCount: shortages.data.length,
  })

  const hasSuggestion = lines.some((line) => line.source === 'suggested')
  const statusTag = current ? (
    <StatusTag color={statusColors[current.status]} style={{ marginInlineEnd: 0 }}>
      {rosterStatusLabels[current.status]}
    </StatusTag>
  ) : (
    <StatusTag mark="draft" style={{ marginInlineEnd: 0 }}>
      Chưa có phân công
    </StatusTag>
  )
  const actions = (
    <>
      <Button icon={<Icon name="liturgy-tip" />} onClick={handleSuggest} disabled={effectiveLocked} loading={suggest.isPending}>
        {hasSuggestion ? 'Gợi ý lại' : 'Gợi ý phân công'}
      </Button>
      {(wholeService.data?.length ?? 0) > 0 && (
        <Button
          icon={<Icon name="practice" />}
          onClick={handleFinalizeWholeService}
          disabled={!current || effectiveLocked || wholeServiceLocked || wholeServiceLines.length === 0}
        >
          Chốt nhạc công
        </Button>
      )}
      <Tooltip title={locked || wholeServiceLocked ? undefined : 'Chốt phân công (hoặc chốt nhạc công) trước khi gửi thông báo.'}>
        <Button
          icon={<Icon name="notification" />}
          onClick={() => setNotifying(true)}
          disabled={readOnly || !(locked || wholeServiceLocked) || announceable.length === 0}
        >
          Gửi thông báo phân công
        </Button>
      </Tooltip>
      <Tooltip title={approved ? undefined : 'Chốt phân công được sau khi danh sách bài hát được duyệt.'}>
        <Button type="primary" icon={<Icon name="lock" />} onClick={handleFinalize} disabled={!current || effectiveLocked || !approved}>
          Chốt phân công
        </Button>
      </Tooltip>
    </>
  )

  return (
    <>
    {head(actions, statusTag)}
    <Flex vertical gap={spacing.lg}>
      <div className="ctb-filters">
        {picker}
        <Segmented
          aria-label="Phạm vi phân công"
          value={scope}
          onChange={(value) => switchSong(value === 'service' ? undefined : (songId ?? songs[0]?.id))}
          options={[
            { label: 'Cả Thánh lễ', value: 'service' },
            { label: 'Theo bài hát', value: 'song', disabled: !approved || songs.length === 0 },
          ]}
        />
        {scope === 'song' && (
          <Select
            {...SELECT_POPUP_PROPS}
            aria-label="Bài hát"
            value={songId}
            onChange={switchSong}
            options={songs.map((song) => {
              const short = shortages.data.filter((item) => item.songListItemId === song.id).length
              return { value: song.id, label: [song.liturgicalPart, song.title, short && `thiếu ${short}`].filter(Boolean).join(' · ') }
            })}
            style={{ minWidth: 280 }}
          />
        )}
        <span className="ctb-filters__end" style={staffingStatusStyle}>
          {staffingStatus}
        </span>
      </div>
      {shortages.data.length > 0 && (
        <Flex wrap align="center" gap={spacing.xs} role="region" aria-label="Các vị trí còn thiếu">
          <Typography.Text style={{ color: 'var(--hm-area-attention-ink)', fontSize: typography.metadata.fontSize, fontWeight: 600 }}>
            Đi nhanh tới vị trí thiếu:
          </Typography.Text>
          {shortages.data.map((shortage) => {
            const targetSong = shortage.songListItemId ? songs.find((s) => s.id === shortage.songListItemId) : undefined
            const canJump = shortage.songListItemId === null || Boolean(targetSong)
            const missing = shortage.requiredCount - shortage.assignedCount
            const active = shortage.songListItemId === null ? scope === 'service' : pickedSong?.id === shortage.songListItemId
            return (
              <Button
                key={`${shortage.songListItemId ?? 'service'}:${shortage.skillId}`}
                size="small"
                type={active ? 'primary' : 'default'}
                ghost={active}
                disabled={!canJump}
                onClick={() => switchSong(shortage.songListItemId ?? undefined)}
              >
                {shortage.songListItemId === null ? 'Cả buổi lễ' : (shortage.songTitle ?? targetSong?.title ?? 'Bài hát')} · {voicePartName(shortage.skillName)} (-{missing})
              </Button>
            )
          })}
        </Flex>
      )}
      {children}
      {locked && <Alert type="success" showIcon title="Phân công đã chốt. Yêu cầu nhân sự và phân công chỉ còn xem." />}
      {!locked && wholeServiceLocked && current?.wholeServiceFinalizedAt && (
        <Alert
          type="info"
          showIcon
          title={`Đã chốt nhạc công lúc ${formatDateTime(current.wholeServiceFinalizedAt)}.`}
          description="Vai cả buổi lễ chỉ còn thay người được; gửi thông báo được cho họ ngay. Phần theo bài vẫn sửa được."
        />
      )}
      {scope === 'service' ? (
        <StaffingCard
          programId={programId}
          assignments={wholeServiceLines}
          otherLines={songLines}
          shortages={shortages.data.filter((item) => item.songListItemId === null)}
          eligible={eligible}
          skills={skills}
          locked={effectiveLocked}
          linesLocked={wholeServiceLocked}
          onDirtyChange={setCardDirty}
        />
      ) : (
        pickedSong && (
          <StaffingCard
            key={pickedSong.id}
            programId={programId}
            song={pickedSong}
            assignments={songLines.filter((line) => line.songListItemId === pickedSong.id)}
            otherLines={wholeServiceLines}
            shortages={shortages.data.filter((item) => item.songListItemId === pickedSong.id)}
            wholeServiceCounts={wholeServiceCounts}
            eligible={eligible}
            skills={skills}
            locked={effectiveLocked}
            onDirtyChange={setCardDirty}
          />
        )
      )}
      {!approved && songListNotice}
      <NotifyDrawer
        open={notifying}
        members={announceable}
        sending={notify.isPending}
        onSend={handleNotify}
        onCancel={() => setNotifying(false)}
      />
    </Flex>
    </>
  )
}
