import { Button, Card, Descriptions, Flex, Typography } from 'antd'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { usePreparationStatus } from '../hooks/useEvents'
import type { PreparationStatus } from '../types'
import { SongListStatusTag } from './SongListStatusTag'

const muted = { color: colors.textMuted }
const numeric = { fontFamily: typography.fontFamilyNumeric }

/** "a/b" with the share in percent once there is something to count. */
const ratio = (part: number, whole: number) => (
  <span style={numeric}>
    {part}/{whole}
    {whole > 0 && ` (${Math.round((part / whole) * 100)}%)`}
  </span>
)

function participation({ invited, confirmed, declined, unsure }: PreparationStatus['participation']) {
  if (invited + confirmed + declined + unsure === 0) return <Typography.Text style={muted}>Chưa gửi yêu cầu xác nhận</Typography.Text>
  return `${confirmed} xác nhận · ${declined} từ chối · ${unsure} chưa chắc chắn · ${invited} chưa phản hồi`
}

function roster({ rosterFinalized, rosterActiveAssignments, rosterShortages }: PreparationStatus) {
  const state =
    rosterFinalized === undefined
      ? 'Chưa phân công'
      : `${rosterFinalized ? 'Đã chốt' : 'Đang phân công'} · ${rosterActiveAssignments} lượt phân công`
  return (
    <Flex vertical>
      <span>{state}</span>
      {rosterShortages === undefined ? (
        <Typography.Text style={muted}>Chưa tính được nhu cầu nhân sự: danh sách bài hát chưa được duyệt.</Typography.Text>
      ) : rosterShortages.length === 0 ? (
        <Typography.Text style={muted}>Đủ người cho mọi bài hát.</Typography.Text>
      ) : (
        rosterShortages.map((shortage) => (
          <Typography.Text key={`${shortage.songTitle}-${shortage.skillName}`} type="danger">
            Thiếu {shortage.skillName} cho {shortage.songTitle}: {shortage.assignedCount}/{shortage.requiredCount} người
          </Typography.Text>
        ))
      )}
    </Flex>
  )
}

/**
 * Parish Priest: how ready the choir is for a published event (FE-21, `GET /api/liturgical-events/{id}/preparation-status`).
 * The backend gives raw counts; each line shows them as they are.
 */
export function PreparationStatusCard({ eventId }: { eventId: string }) {
  const navigate = useNavigate()
  const status = usePreparationStatus(eventId)
  const songListStatus = status.data?.songListStatus
  // Only a submitted or an approved list can be read by event (tbd-backlog B14).
  const songListAction =
    songListStatus === 'submitted' ? 'Duyệt danh sách' : songListStatus === 'approved' ? 'Xem danh sách' : undefined

  return (
    <Card title="Tình hình chuẩn bị">
      {status.isPending && <SectionSkeleton rows={4} label="Đang tải tình hình chuẩn bị" />}
      {status.isError && (
        <ErrorState title="Không thể tải tình hình chuẩn bị" onRetry={() => status.refetch()} retrying={status.isFetching} />
      )}
      {status.isSuccess && (
        <Descriptions
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
            { key: 'participation', label: 'Xác nhận tham gia', children: participation(status.data.participation) },
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
                      <span style={numeric}>
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
                    <span style={numeric}>{status.data.practiceOverdue}</span>
                  </span>
                ),
            },
          ]}
        />
      )}
    </Card>
  )
}
