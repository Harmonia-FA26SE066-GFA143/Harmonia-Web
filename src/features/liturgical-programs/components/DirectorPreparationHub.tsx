import { Alert, Button, Card, Col, Flex, Progress, Row, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { useSongList } from '@/features/song-lists'
import { parseUtc } from '@/lib/api/dates'
import { CardTitle, CREATE_ASSIGNMENT_LABEL, ErrorState, Icon, SectionSkeleton, StatusTag } from '@/shared/ui'
import { colors, radius, sections, spacing, typography } from '@/styles/tokens'
import { usePreparationStatus } from '../hooks/useEvents'
import type { LiturgicalProgramDetail } from '../types'

/**
 * The song-list action lives once, in the page's "Chương trình" section head (SYS-06); the review alerts here say
 * where the list stands and what comes next without repeating that button.
 */
interface DirectorPreparationHubProps {
  program: LiturgicalProgramDetail
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/** One preparation step: its name and state, what stands, and the buttons that move it on, at the card's foot. */
function StepCard({ icon, title, tag, actions, children }: Readonly<{ icon: ReactNode; title: string; tag: ReactNode; actions: ReactNode; children: ReactNode }>) {
  return (
    <Col xs={24} lg={12}>
      <Card
        size="small"
        variant="outlined"
        style={{ height: '100%', borderRadius: radius.md, background: colors.softSurface, display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
      >
        <div>
          <Flex align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.sm }}>
            <Flex align="center" gap={spacing.xs} style={{ color: colors.primary, fontSize: typography.cardHeading.fontSize }}>
              {icon}
              <Typography.Text strong style={{ fontSize: typography.cardHeading.fontSize }}>
                {title}
              </Typography.Text>
            </Flex>
            {tag}
          </Flex>
          <div style={{ minHeight: 46 }}>{children}</div>
        </div>
        <div style={{ marginTop: spacing.md }}>{actions}</div>
      </Card>
    </Col>
  )
}

type PrepData = NonNullable<ReturnType<typeof usePreparationStatus>['data']>

function SongListReviewAlert({
  status,
  decidedAt,
  reviewNotes,
}: Readonly<{ status: LiturgicalProgramDetail['songListStatus']; decidedAt?: string; reviewNotes?: string }>) {
  const timeSuffix = decidedAt ? ` (lúc ${decidedAt})` : ''
  if (status === 'needsRevision') {
    return (
      <Alert
        type="warning"
        showIcon
        icon={<Icon name="warning" />}
        title={
          <Typography.Text strong style={{ fontSize: typography.cardHeading.fontSize }}>
            Cha xứ yêu cầu chỉnh sửa danh sách bài hát{timeSuffix}
          </Typography.Text>
        }
        description={
          <Flex vertical gap={spacing.xs} style={{ marginTop: 4 }}>
            {reviewNotes ? (
              <Typography.Text style={{ fontStyle: 'italic' }}>
                Nhận xét của Cha xứ: “{reviewNotes}”
              </Typography.Text>
            ) : (
              <Typography.Text>Cha xứ đã yêu cầu chỉnh sửa lại các bài hát đề xuất.</Typography.Text>
            )}
            <Typography.Text style={{ color: colors.textMuted }}>
              Vui lòng cập nhật danh sách bài hát theo yêu cầu và gửi duyệt lại để mở khóa phân công phục vụ.
            </Typography.Text>
          </Flex>
        }
        style={{ borderRadius: radius.md }}
      />
    )
  }
  if (status === 'rejected') {
    return (
      <Alert
        type="error"
        showIcon
        icon={<Icon name="warning" />}
        title={
          <Typography.Text strong style={{ fontSize: typography.cardHeading.fontSize }}>
            Danh sách bài hát đã bị từ chối{timeSuffix}
          </Typography.Text>
        }
        description={
          <Flex vertical gap={spacing.xs} style={{ marginTop: 4 }}>
            {reviewNotes && (
              <Typography.Text style={{ fontStyle: 'italic' }}>
                Lý do từ Cha xứ: “{reviewNotes}”
              </Typography.Text>
            )}
            <Typography.Text style={{ color: colors.textMuted }}>
              Biên soạn lại danh sách bài hát phù hợp hơn từ kho bài hát và gửi duyệt lại.
            </Typography.Text>
          </Flex>
        }
        style={{ borderRadius: radius.md }}
      />
    )
  }
  if (status === 'submitted') {
    return (
      <Alert
        type="info"
        showIcon
        icon={<Icon name="history" />}
        title={
          <Typography.Text strong style={{ fontSize: typography.cardHeading.fontSize }}>
            Danh sách bài hát đang chờ Cha xứ phê duyệt
          </Typography.Text>
        }
        description={
          <Typography.Text style={{ color: colors.textMuted }}>
            Trong lúc chờ duyệt, bạn có thể gửi yêu cầu xác nhận tham gia và lên lịch tập trước cho ca viên.
            Phân công phục vụ sẽ được mở sau khi bài hát được duyệt.
          </Typography.Text>
        }
        style={{ borderRadius: radius.md }}
      />
    )
  }
  if (status === 'approved') {
    return (
      <Alert
        type="success"
        showIcon
        icon={<Icon name="check-circle" />}
        title={
          <Typography.Text strong style={{ fontSize: typography.cardHeading.fontSize }}>
            Danh sách bài hát đã được Cha xứ phê duyệt{timeSuffix}
          </Typography.Text>
        }
        description={
          <Typography.Text style={{ color: colors.textMuted }}>
            Danh sách bài hát đã khóa. Hệ thống đã mở phân công phục vụ và giao bài luyện tập tương ứng.
          </Typography.Text>
        }
        style={{ borderRadius: radius.md }}
      />
    )
  }
  return (
    <Alert
      type="info"
      showIcon
      title={
        <Typography.Text strong style={{ fontSize: typography.cardHeading.fontSize }}>
          Chưa đề xuất danh sách bài hát
        </Typography.Text>
      }
      description="Bước đầu tiên để chuẩn bị phụng vụ: Chọn các bài hát phù hợp từ kho và gửi Cha xứ phê duyệt."
      style={{ borderRadius: radius.md }}
    />
  )
}

function ParticipationStep({ programId, prep, onNavigate }: Readonly<{ programId: string; prep?: PrepData; onNavigate: (to: string) => void }>) {
  const totalInvited = prep
    ? prep.participation.invited + prep.participation.confirmed + prep.participation.declined + prep.participation.unsure
    : 0
  const confirmedCount = prep?.participation.confirmed ?? 0
  let tag: ReactNode = <StatusTag color="gold">Chờ phản hồi</StatusTag>
  if (totalInvited === 0) tag = <Tag style={{ marginInlineEnd: 0 }}>Chưa gửi</Tag>
  else if (confirmedCount > 0) tag = <StatusTag color="green">{confirmedCount} đã xác nhận</StatusTag>

  return (
    <StepCard
      icon={<Icon name="participation" />}
      title="Xác nhận tham gia"
      tag={tag}
      actions={
        <Button
          block
          icon={<Icon name="arrow-right" />}
          iconPlacement="end"
          onClick={() => onNavigate(`${paths.director.participation}?programId=${programId}`)}
        >
          {totalInvited === 0 ? 'Gửi yêu cầu xác nhận' : 'Xem & gửi thêm ca viên'}
        </Button>
      }
    >
      {totalInvited === 0 ? (
        <Typography.Text style={muted}>
          Chưa gửi yêu cầu xác nhận nào đến ca viên cho chương trình này.
        </Typography.Text>
      ) : (
        <Flex vertical gap={2}>
          <Typography.Text>
            <strong>{confirmedCount}</strong> xác nhận ·{' '}
            <span>{prep?.participation.unsure ?? 0}</span> chưa chắc chắn ·{' '}
            <span>{prep?.participation.declined ?? 0}</span> từ chối
          </Typography.Text>
          {(prep?.participation.invited ?? 0) > 0 && (
            <Typography.Text style={muted}>
              Còn <span>{prep?.participation.invited}</span> ca viên chưa trả lời
            </Typography.Text>
          )}
        </Flex>
      )}
    </StepCard>
  )
}

function RehearsalStep({ programId, prep, onNavigate }: Readonly<{ programId: string; prep?: PrepData; onNavigate: (to: string) => void }>) {
  const rehearsalsTotal = prep?.rehearsalsTotal ?? 0
  const rehearsalsHeld = prep?.rehearsalsHeld ?? 0
  const attendanceRate =
    prep && prep.attendanceExpected > 0
      ? Math.round((prep.attendancePresent / prep.attendanceExpected) * 100)
      : undefined

  return (
    <StepCard
      icon={<Icon name="rehearsal" />}
      title="Buổi tập và điểm danh"
      tag={
        rehearsalsTotal === 0 ? (
          <Tag style={{ marginInlineEnd: 0 }}>Chưa có lịch</Tag>
        ) : (
          <StatusTag color="processing">
            {rehearsalsHeld}/{rehearsalsTotal} buổi đã tập
          </StatusTag>
        )
      }
      actions={
        <Flex gap={spacing.xs}>
          <Button
            style={{ flex: 1 }}
            icon={<Icon name="calendar" />}
            onClick={() => onNavigate(`${paths.director.rehearsals}?programId=${programId}`)}
          >
            Lịch tập
          </Button>
          <Button
            style={{ flex: 1 }}
            onClick={() => onNavigate(`${paths.director.attendance}?programId=${programId}`)}
          >
            Điểm danh
          </Button>
        </Flex>
      }
    >
      {rehearsalsTotal === 0 ? (
        <Typography.Text style={muted}>
          Lên kế hoạch các buổi tập hát để ca đoàn luyện bài trước ngày lễ.
        </Typography.Text>
      ) : (
        <Flex vertical gap={2}>
          <Typography.Text>
            Đã lên lịch <strong>{rehearsalsTotal}</strong> buổi tập
          </Typography.Text>
          {attendanceRate !== undefined && (
            <Typography.Text style={muted}>
              Tỷ lệ có mặt: <span>{attendanceRate}%</span> ({prep?.attendancePresent}/{prep?.attendanceExpected} lượt)
            </Typography.Text>
          )}
        </Flex>
      )}
    </StepCard>
  )
}

function PracticeStep({ programId, prep, onNavigate }: Readonly<{ programId: string; prep?: PrepData; onNavigate: (to: string) => void }>) {
  const practiceExpected = prep?.practiceExpected ?? 0
  const practicePassed = prep?.practicePassed ?? 0
  const practiceOverdue = prep?.practiceOverdue ?? 0
  const practiceRate = practiceExpected > 0 ? Math.round((practicePassed / practiceExpected) * 100) : undefined
  let tag: ReactNode = <StatusTag color="green">{practicePassed}/{practiceExpected} đạt</StatusTag>
  if (practiceExpected === 0) tag = <Tag style={{ marginInlineEnd: 0 }}>Chưa giao bài</Tag>
  else if (practiceOverdue > 0) tag = <StatusTag color="red">{practiceOverdue} quá hạn</StatusTag>

  return (
    <StepCard
      icon={<Icon name="practice" />}
      title="Bài tập và luyện tập"
      tag={tag}
      actions={
        <Flex gap={spacing.xs}>
          <Button
            style={{ flex: 1 }}
            icon={<Icon name="arrow-right" />}
            iconPlacement="end"
            onClick={() => onNavigate(`${paths.director.practice}?programId=${programId}&tab=progress`)}
          >
            Xem tiến độ
          </Button>
          <Button
            style={{ flex: 1 }}
            onClick={() => onNavigate(`${paths.director.practiceNew}?programId=${programId}`)}
          >
            {CREATE_ASSIGNMENT_LABEL}
          </Button>
        </Flex>
      }
    >
      {practiceExpected === 0 ? (
        <Typography.Text style={muted}>
          Giao bài tập nộp bản thu cho từng bè hoặc từng ca viên để chấm tiến độ.
        </Typography.Text>
      ) : (
        <Flex vertical gap={4}>
          <Flex align="center" justify="space-between">
            <Typography.Text>
              Đạt <strong>{practicePassed}</strong> / {practiceExpected} lượt nộp
            </Typography.Text>
            {practiceRate !== undefined && (
              <Typography.Text style={muted}>
                {practiceRate}%
              </Typography.Text>
            )}
          </Flex>
          {practiceRate !== undefined && (
            <Progress
              percent={practiceRate}
              size="small"
              showInfo={false}
              strokeColor={sections.practice.cloth}
            />
          )}
        </Flex>
      )}
    </StepCard>
  )
}

function RosterStep({
  programId,
  songListApproved,
  prep,
  onNavigate,
}: Readonly<{ programId: string; songListApproved: boolean; prep?: PrepData; onNavigate: (to: string) => void }>) {
  const rosterFinalized = prep?.rosterFinalized ?? false
  const activeAssignments = prep?.rosterActiveAssignments ?? 0
  const shortages = prep?.rosterShortages ?? []
  let tag: ReactNode = <StatusTag color="processing">Đang phân công</StatusTag>
  if (!songListApproved) tag = <Tag style={{ marginInlineEnd: 0 }}>Chờ duyệt bài hát</Tag>
  else if (rosterFinalized) tag = <StatusTag color="green">Đã chốt phân công</StatusTag>

  return (
    <StepCard
      icon={<Icon name="roster" />}
      title="Phân công phục vụ"
      tag={tag}
      actions={
        <Button
          block
          type={songListApproved ? 'primary' : 'default'}
          icon={<Icon name="arrow-right" />}
          iconPlacement="end"
          onClick={() => onNavigate(`${paths.director.roster}?programId=${programId}`)}
        >
          {songListApproved ? 'Lập & điều chỉnh phân công' : 'Xem trang phân công'}
        </Button>
      }
    >
      {!songListApproved ? (
        <Typography.Text style={muted}>
          Yêu cầu danh sách bài hát được Cha xứ phê duyệt trước khi thiết lập phân công.
        </Typography.Text>
      ) : (
        <Flex vertical gap={2}>
          <Typography.Text>
            {rosterFinalized ? 'Đã chốt' : 'Đang phân công'} ·{' '}
            <strong>{activeAssignments}</strong> lượt ca viên
          </Typography.Text>
          {shortages.length > 0 && (
            <Typography.Text style={{ fontSize: 13 }}>
              Còn thiếu nhân sự cho <strong>{shortages.length}</strong> vị trí
            </Typography.Text>
          )}
        </Flex>
      )}
    </StepCard>
  )
}

export function DirectorPreparationHub({ program }: Readonly<DirectorPreparationHubProps>) {
  const navigate = useNavigate()
  const prepStatus = usePreparationStatus(program.id)
  const songList = useSongList(program.id)

  const prep = prepStatus.data
  const reviewNotes = songList.data?.reviews.at(-1)?.notes
  const decidedAt = songList.data?.decidedAt
    ? dayjs(parseUtc(songList.data.decidedAt)).format('HH:mm DD/MM/YYYY')
    : undefined
  const songListApproved = program.songListStatus === 'approved'

  return (
    <Flex vertical gap={spacing.md}>
      <SongListReviewAlert status={program.songListStatus} decidedAt={decidedAt} reviewNotes={reviewNotes} />

      <Card
        title={
          <Flex align="center" justify="space-between" wrap gap={spacing.sm}>
            <CardTitle>Các bước chuẩn bị phục vụ</CardTitle>
            <Typography.Text style={muted}>
              Giữ nhịp chuẩn bị toàn diện cho ca đoàn
            </Typography.Text>
          </Flex>
        }
      >
        {prepStatus.isPending && <SectionSkeleton rows={4} label="Đang tải tình hình chuẩn bị" />}
        {prepStatus.isError && (
          <ErrorState
            title="Không thể tải tình hình chuẩn bị"
            error={prepStatus.error}
            onRetry={() => prepStatus.refetch()}
            retrying={prepStatus.isFetching}
          />
        )}

        <Row
          gutter={[spacing.md, spacing.md]}
          style={{ display: prepStatus.isPending || prepStatus.isError ? 'none' : undefined }}
        >
          <ParticipationStep programId={program.id} prep={prep} onNavigate={navigate} />
          <RehearsalStep programId={program.id} prep={prep} onNavigate={navigate} />
          <PracticeStep programId={program.id} prep={prep} onNavigate={navigate} />
          <RosterStep programId={program.id} songListApproved={songListApproved} prep={prep} onNavigate={navigate} />
        </Row>
      </Card>
    </Flex>
  )
}
