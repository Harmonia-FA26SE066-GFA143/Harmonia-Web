import { Button, Descriptions, Flex, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { participationResponseLabels, useParticipation, type ParticipationRequest } from '@/features/participation'
import { formatDateTime } from '@/lib/api/dates'
import { EmptyCell, EmptyState, ErrorState, SectionSkeleton, StatusTag, ViewDrawer, voicePartName, type StatusTagColor } from '@/shared/ui'
import { colors, component, spacing } from '@/styles/tokens'
import { usePreparationStatus } from '../hooks/useEvents'
import { preparationItems } from '../preparationOverview'
import type { PreparationStatus } from '../types'
import { PreparationOverview } from './PreparationOverview'
import { SongListStatusTag } from './SongListStatusTag'

const muted = { color: colors.textMuted }

/** "a/b" with the share in percent once there is something to count. */
const ratio = (part: number, whole: number) => (
  <span>
    {part}/{whole}
    {whole > 0 && ` (${Math.round((part / whole) * 100)}%)`}
  </span>
)

function participation({ invited, confirmed, declined, unsure }: PreparationStatus['participation'], onShow: () => void) {
  if (invited + confirmed + declined + unsure === 0) return <Typography.Text style={muted}>Chưa gửi yêu cầu xác nhận</Typography.Text>
  return (
    <Flex vertical align="start" gap={spacing.xs}>
      <span>{`${confirmed} xác nhận · ${declined} từ chối · ${unsure} chưa chắc chắn · ${invited} chưa phản hồi`}</span>
      {/* Named apart from the song list's own "Xem danh sách" on the same card. */}
      <Button size="small" aria-label="Xem danh sách phản hồi tham gia" onClick={onShow}>
        Xem danh sách
      </Button>
    </Flex>
  )
}

const responseColors: Record<NonNullable<ParticipationRequest['response']>, StatusTagColor> = { confirmed: 'green', unsure: 'gold', declined: 'red' }

const replyColumns: TableColumnsType<ParticipationRequest> = [
  {
    key: 'name',
    title: 'Ca viên',
    render: (_, request) => (
      <Flex vertical align="start" gap={2}>
        <Typography.Text strong>{request.fullName}</Typography.Text>
        {request.hasTimeConflict && <Tag color="warning">Trùng lịch</Tag>}
      </Flex>
    ),
  },
  {
    key: 'response',
    title: 'Phản hồi',
    render: (_, request) => (
      <StatusTag color={request.response ? responseColors[request.response] : 'default'} style={{ marginInlineEnd: 0 }}>
        {request.response ? participationResponseLabels[request.response] : 'Chưa phản hồi'}
      </StatusTag>
    ),
  },
  { key: 'note', title: 'Ghi chú', render: (_, request) => request.note || <EmptyCell text="Không có" /> },
  {
    key: 'respondedAt',
    title: 'Phản hồi lúc',
    render: (_, request) => (request.respondedAt ? formatDateTime(request.respondedAt) : <EmptyCell text="Chưa phản hồi" />),
  },
]

/**
 * Read-only answers of the members asked to serve (`GET /api/event-participations`, open to the Parish Priest since
 * B61). Mounted only while open, so the card does not load them; the Choir Director's actions stay on the participation page.
 */
function ParticipationRepliesDrawer({ eventId, onClose }: Readonly<{ eventId: string; onClose: () => void }>) {
  const replies = useParticipation(eventId)
  return (
    <ViewDrawer open title="Danh sách phản hồi tham gia" size={component.drawer.lg} onClose={onClose} destroyOnHidden>
      {replies.isPending && <SectionSkeleton rows={4} label="Đang tải danh sách phản hồi" />}
      {replies.isError && (
        <ErrorState headingLevel={3} title="Không thể tải danh sách phản hồi" error={replies.error} hasData={false} onRetry={() => replies.refetch()} retrying={replies.isFetching} />
      )}
      {replies.data?.length === 0 && <EmptyState headingLevel={3} title="Chưa có ca viên nào được mời" />}
      {replies.data !== undefined && replies.data.length > 0 && (
        <Table<ParticipationRequest> rowKey="id" columns={replyColumns} dataSource={replies.data} pagination={false} />
      )}
    </ViewDrawer>
  )
}

function shortageLines(shortages: PreparationStatus['rosterShortages']) {
  if (shortages === undefined) {
    return (
      <Typography.Text style={muted}>
        Chưa tính được nhu cầu nhân sự: danh sách bài hát chưa được duyệt và chưa khai vai cả buổi lễ.
      </Typography.Text>
    )
  }
  if (shortages.length === 0) return <Typography.Text style={muted}>Đủ người cho các vị trí đã khai.</Typography.Text>
  return shortages.map((shortage) => (
    // A shortage is said in words, not in red (brief §12.7).
    <Typography.Text key={`${shortage.songTitle ?? 'whole-service'}-${shortage.skillName}`}>
      Thiếu {voicePartName(shortage.skillName)} cho {shortage.songTitle ?? 'cả buổi lễ'}: {shortage.assignedCount}/{shortage.requiredCount} người
    </Typography.Text>
  ))
}

function roster({ rosterFinalized, rosterActiveAssignments, rosterShortages }: PreparationStatus) {
  let state = 'Chưa phân công'
  if (rosterFinalized !== undefined) {
    const stage = rosterFinalized ? 'Đã chốt' : 'Đang phân công'
    state = `${stage} · ${rosterActiveAssignments} lượt phân công`
  }
  return (
    <Flex vertical>
      <span>{state}</span>
      {shortageLines(rosterShortages)}
    </Flex>
  )
}

/** A draft stays the Choir Director's; any other list is read on the review page. */
function songListActionLabel(songListStatus: PreparationStatus['songListStatus']) {
  if (songListStatus === 'submitted') return 'Duyệt danh sách'
  if (songListStatus && songListStatus !== 'draft') return 'Xem danh sách'
  return undefined
}

/**
 * Parish Priest: how ready the choir is for a published event (FE-21, `GET /api/liturgical-events/{id}/preparation-status`).
 * Combines the five-item overview and the raw backend counts inside one reading sheet.
 */
export function PreparationStatusCard({ eventId, eventDate }: Readonly<{ eventId: string; eventDate?: string }>) {
  const navigate = useNavigate()
  const status = usePreparationStatus(eventId)
  const songListStatus = status.data?.songListStatus
  const songListAction = songListActionLabel(songListStatus)
  const [showReplies, setShowReplies] = useState(false)
  const overviewItems =
    eventDate && status.data
      ? preparationItems({
          date: eventDate,
          songListStatus: status.data.songListStatus,
          status: status.data,
          failed: false,
          viewer: 'priest',
        })
      : undefined

  return (
    <section className="hm-sheet-section priest-queue hm-paper" aria-labelledby="prep-heading">
      <header className="hm-sheet-section__head">
        <h2 id="prep-heading" className="hm-rubric">
          Tình hình chuẩn bị
        </h2>
      </header>
      <div className="priest-sheet__body">
        {status.isPending && <SectionSkeleton rows={4} label="Đang tải tình hình chuẩn bị" />}
        {status.isError && (
          <ErrorState headingLevel={3} title="Không thể tải tình hình chuẩn bị" error={status.error} hasData={status.data !== undefined} onRetry={() => status.refetch()} retrying={status.isFetching} />
        )}
        {overviewItems && (
          <div style={{ marginBottom: spacing.md, paddingBottom: spacing.md, borderBottom: `1px solid ${colors.border}` }}>
            {/* One column: the aside is a third of the page wide (G3-07). */}
            <PreparationOverview items={overviewItems} columns={1} />
          </div>
        )}
        {status.data !== undefined && (
          <>
            {overviewItems && (
              <p className="hm-rubric" style={{ marginBottom: spacing.xs }}>
                Chi tiết tiến độ
              </p>
            )}
            <Descriptions
              className="hm-key-value"
              column={1}
              items={[
                {
                  key: 'songList',
                  label: 'Danh sách bài hát',
                  children: (
                    <Flex wrap align="center" gap={spacing.sm}>
                      <SongListStatusTag status={songListStatus} />
                      {songListAction && (
                        <Button
                          size="small"
                          type={songListStatus === 'submitted' ? 'primary' : 'default'}
                          onClick={() => navigate(generatePath(paths.priest.songListReview, { programId: eventId }))}
                        >
                          {songListAction}
                        </Button>
                      )}
                    </Flex>
                  ),
                },
                { key: 'participation', label: 'Xác nhận tham gia', children: participation(status.data.participation, () => setShowReplies(true)) },
                { key: 'roster', label: 'Phân công phục vụ', children: roster(status.data) },
                {
                  key: 'rehearsals',
                  label: 'Buổi tập',
                  children:
                    status.data.rehearsalsTotal === 0 ? (
                      <Typography.Text style={muted}>Chưa có buổi tập</Typography.Text>
                    ) : (
                      <Flex vertical>
                        <span>
                          <span>
                            {status.data.rehearsalsHeld}/{status.data.rehearsalsTotal}
                          </span>{' '}
                          buổi đã diễn ra
                        </span>
                        {status.data.rehearsalsHeld > 0 && (
                          <span>Lượt có mặt: {ratio(status.data.attendancePresent, status.data.attendanceExpected)}</span>
                        )}
                      </Flex>
                    ),
                },
                {
                  key: 'practice',
                  label: 'Bài tập',
                  children:
                    status.data.practiceExpected === 0 ? (
                      <Typography.Text style={muted}>Chưa giao bài tập</Typography.Text>
                    ) : (
                      <span>
                        Đạt {ratio(status.data.practicePassed, status.data.practiceExpected)} · quá hạn{' '}
                        <span>{status.data.practiceOverdue}</span>
                      </span>
                    ),
                },
              ]}
            />
          </>
        )}
      </div>
      {showReplies && <ParticipationRepliesDrawer eventId={eventId} onClose={() => setShowReplies(false)} />}
    </section>
  )
}
