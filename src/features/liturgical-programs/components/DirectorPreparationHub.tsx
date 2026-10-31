import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ScheduleOutlined,
  SoundOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Col, Flex, Progress, Row, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { useSongList } from '@/features/song-lists'
import { parseUtc } from '@/lib/api/dates'
import { CardTitle, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'
import { useDirectorPreparation } from '../hooks/useDirectorPreparation'
import type { LiturgicalProgramDetail } from '../types'

interface DirectorPreparationHubProps {
  program: LiturgicalProgramDetail
  onOpenSongList: () => void
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }
const numeric = { fontVariantNumeric: 'tabular-nums' }

export function DirectorPreparationHub({ program, onOpenSongList }: Readonly<DirectorPreparationHubProps>) {
  const navigate = useNavigate()
  const prepStatus = useDirectorPreparation(program.id)
  const songList = useSongList(program.id)

  const prep = prepStatus.data
  const latestReview = songList.data?.reviews.at(-1)
  const reviewNotes = latestReview?.notes
  const decidedAt = songList.data?.decidedAt
    ? dayjs(parseUtc(songList.data.decidedAt)).format('HH:mm DD/MM/YYYY')
    : undefined

  // 1. Participation metrics
  const totalInvited = prep
    ? prep.participation.invited + prep.participation.confirmed + prep.participation.declined + prep.participation.unsure
    : 0
  const confirmedCount = prep?.participation.confirmed ?? 0

  // 2. Rehearsal metrics
  const rehearsalsTotal = prep?.rehearsalsTotal ?? 0
  const rehearsalsHeld = prep?.rehearsalsHeld ?? 0
  const attendanceRate =
    prep && prep.attendanceExpected > 0
      ? Math.round((prep.attendancePresent / prep.attendanceExpected) * 100)
      : undefined

  // 3. Practice metrics
  const practiceExpected = prep?.practiceExpected ?? 0
  const practicePassed = prep?.practicePassed ?? 0
  const practiceOverdue = prep?.practiceOverdue ?? 0
  const practiceRate =
    practiceExpected > 0 ? Math.round((practicePassed / practiceExpected) * 100) : undefined

  // 4. Roster metrics
  const songListApproved = program.songListStatus === 'approved'
  const rosterFinalized = prep?.rosterFinalized ?? false
  const activeAssignments = prep?.rosterActiveAssignments ?? 0
  const shortages = prep?.rosterShortages ?? []

  return (
    <Flex vertical gap={spacing.md}>
      {/* Review Feedback Alert: Shows clear guidance based on Priest's decision */}
      {program.songListStatus === 'needsRevision' && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          title={
            <Typography.Text strong style={{ fontSize: 15 }}>
              Cha xứ yêu cầu chỉnh sửa danh sách bài hát {decidedAt ? `(lúc ${decidedAt})` : ''}
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
          action={
            <Button type="primary" onClick={onOpenSongList}>
              Cập nhật bài hát ngay
            </Button>
          }
          style={{ borderRadius: radius.md }}
        />
      )}

      {program.songListStatus === 'rejected' && (
        <Alert
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          title={
            <Typography.Text strong style={{ fontSize: 15 }}>
              Danh sách bài hát đã bị từ chối {decidedAt ? `(lúc ${decidedAt})` : ''}
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
          action={
            <Button type="primary" danger onClick={onOpenSongList}>
              Soạn lại danh sách
            </Button>
          }
          style={{ borderRadius: radius.md }}
        />
      )}

      {program.songListStatus === 'submitted' && (
        <Alert
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
          title={
            <Typography.Text strong style={{ fontSize: 15 }}>
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
      )}

      {program.songListStatus === 'approved' && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          title={
            <Typography.Text strong style={{ fontSize: 15 }}>
              Danh sách bài hát đã được Cha xứ phê duyệt {decidedAt ? `(lúc ${decidedAt})` : ''}
            </Typography.Text>
          }
          description={
            <Typography.Text style={{ color: colors.textMuted }}>
              Danh sách bài hát đã khóa. Hệ thống đã mở phân công phục vụ và giao bài luyện tập tương ứng.
            </Typography.Text>
          }
          style={{ borderRadius: radius.md }}
        />
      )}

      {!program.songListStatus && (
        <Alert
          type="info"
          showIcon
          title={
            <Typography.Text strong style={{ fontSize: 15 }}>
              Chưa đề xuất danh sách bài hát
            </Typography.Text>
          }
          description="Bước đầu tiên để chuẩn bị phụng vụ: Chọn các bài hát phù hợp từ kho và gửi Cha xứ phê duyệt."
          action={
            <Button type="primary" onClick={onOpenSongList}>
              Soạn & đề xuất bài hát
            </Button>
          }
          style={{ borderRadius: radius.md }}
        />
      )}

      {/* Main Preparation Hub Card */}
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
          {/* Step 1: Xác nhận tham gia */}
          <Col xs={24} lg={12}>
            <Card
              size="small"
              variant="outlined"
              style={{
                height: '100%',
                borderRadius: radius.md,
                background: '#FAFAFA',
                display: 'flex',
                flexDirection: 'column',
              }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
            >
              <div>
                <Flex align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.sm }}>
                  <Flex align="center" gap={spacing.xs}>
                    <UsergroupAddOutlined style={{ color: colors.primary, fontSize: 17 }} />
                    <Typography.Text strong style={{ fontSize: 15 }}>
                      Xác nhận tham gia
                    </Typography.Text>
                  </Flex>
                  {totalInvited === 0 ? (
                    <Tag style={{ marginInlineEnd: 0 }}>Chưa gửi</Tag>
                  ) : confirmedCount > 0 ? (
                    <Tag color="success" style={{ marginInlineEnd: 0 }}>
                      {confirmedCount} đã xác nhận
                    </Tag>
                  ) : (
                    <Tag color="warning" style={{ marginInlineEnd: 0 }}>
                      Chờ phản hồi
                    </Tag>
                  )}
                </Flex>

                <div style={{ minHeight: 46 }}>
                  {totalInvited === 0 ? (
                    <Typography.Text style={muted}>
                      Chưa gửi yêu cầu xác nhận nào đến ca viên cho chương trình này.
                    </Typography.Text>
                  ) : (
                    <Flex vertical gap={2}>
                      <Typography.Text style={{ fontSize: 13.5 }}>
                        <strong style={numeric}>{confirmedCount}</strong> xác nhận ·{' '}
                        <span style={numeric}>{prep?.participation.unsure ?? 0}</span> chưa chắc chắn ·{' '}
                        <span style={numeric}>{prep?.participation.declined ?? 0}</span> từ chối
                      </Typography.Text>
                      {(prep?.participation.invited ?? 0) > 0 && (
                        <Typography.Text style={muted}>
                          Còn <span style={numeric}>{prep?.participation.invited}</span> ca viên chưa trả lời
                        </Typography.Text>
                      )}
                    </Flex>
                  )}
                </div>
              </div>

              <div style={{ marginTop: spacing.md }}>
                <Button
                  block
                  icon={<ArrowRightOutlined />}
                  iconPlacement="end"
                  onClick={() => navigate(`${paths.director.participation}?programId=${program.id}`)}
                >
                  {totalInvited === 0 ? 'Gửi yêu cầu xác nhận' : 'Xem & gửi thêm ca viên'}
                </Button>
              </div>
            </Card>
          </Col>

          {/* Step 2: Buổi tập và điểm danh */}
          <Col xs={24} lg={12}>
            <Card
              size="small"
              variant="outlined"
              style={{
                height: '100%',
                borderRadius: radius.md,
                background: '#FAFAFA',
                display: 'flex',
                flexDirection: 'column',
              }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
            >
              <div>
                <Flex align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.sm }}>
                  <Flex align="center" gap={spacing.xs}>
                    <ScheduleOutlined style={{ color: colors.primary, fontSize: 17 }} />
                    <Typography.Text strong style={{ fontSize: 15 }}>
                      Buổi tập và điểm danh
                    </Typography.Text>
                  </Flex>
                  {rehearsalsTotal === 0 ? (
                    <Tag style={{ marginInlineEnd: 0 }}>Chưa có lịch</Tag>
                  ) : (
                    <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                      {rehearsalsHeld}/{rehearsalsTotal} buổi đã tập
                    </Tag>
                  )}
                </Flex>

                <div style={{ minHeight: 46 }}>
                  {rehearsalsTotal === 0 ? (
                    <Typography.Text style={muted}>
                      Lên kế hoạch các buổi tập hát để ca đoàn luyện bài trước ngày lễ.
                    </Typography.Text>
                  ) : (
                    <Flex vertical gap={2}>
                      <Typography.Text style={{ fontSize: 13.5 }}>
                        Đã lên lịch <strong style={numeric}>{rehearsalsTotal}</strong> buổi tập
                      </Typography.Text>
                      {attendanceRate !== undefined && (
                        <Typography.Text style={muted}>
                          Tỷ lệ có mặt: <span style={numeric}>{attendanceRate}%</span> ({prep?.attendancePresent}/{prep?.attendanceExpected} lượt)
                        </Typography.Text>
                      )}
                    </Flex>
                  )}
                </div>
              </div>

              <Flex gap={spacing.xs} style={{ marginTop: spacing.md }}>
                <Button
                  style={{ flex: 1 }}
                  icon={<CalendarOutlined />}
                  onClick={() => navigate(`${paths.director.rehearsals}?programId=${program.id}`)}
                >
                  Lịch tập
                </Button>
                <Button
                  style={{ flex: 1 }}
                  onClick={() => navigate(`${paths.director.attendance}?programId=${program.id}`)}
                >
                  Điểm danh
                </Button>
              </Flex>
            </Card>
          </Col>

          {/* Step 3: Bài tập và luyện tập */}
          <Col xs={24} lg={12}>
            <Card
              size="small"
              variant="outlined"
              style={{
                height: '100%',
                borderRadius: radius.md,
                background: '#FAFAFA',
                display: 'flex',
                flexDirection: 'column',
              }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
            >
              <div>
                <Flex align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.sm }}>
                  <Flex align="center" gap={spacing.xs}>
                    <SoundOutlined style={{ color: colors.primary, fontSize: 17 }} />
                    <Typography.Text strong style={{ fontSize: 15 }}>
                      Bài tập và luyện tập
                    </Typography.Text>
                  </Flex>
                  {practiceExpected === 0 ? (
                    <Tag style={{ marginInlineEnd: 0 }}>Chưa giao bài</Tag>
                  ) : practiceOverdue > 0 ? (
                    <Tag color="error" style={{ marginInlineEnd: 0 }}>
                      {practiceOverdue} quá hạn
                    </Tag>
                  ) : (
                    <Tag color="success" style={{ marginInlineEnd: 0 }}>
                      {practicePassed}/{practiceExpected} đạt
                    </Tag>
                  )}
                </Flex>

                <div style={{ minHeight: 46 }}>
                  {practiceExpected === 0 ? (
                    <Typography.Text style={muted}>
                      Giao bài tập nộp bản thu cho từng bè hoặc từng ca viên để chấm tiến độ.
                    </Typography.Text>
                  ) : (
                    <Flex vertical gap={4}>
                      <Flex align="center" justify="space-between">
                        <Typography.Text style={{ fontSize: 13.5 }}>
                          Đạt <strong style={numeric}>{practicePassed}</strong> / {practiceExpected} lượt nộp
                        </Typography.Text>
                        {practiceRate !== undefined && (
                          <Typography.Text style={{ ...muted, ...numeric }}>
                            {practiceRate}%
                          </Typography.Text>
                        )}
                      </Flex>
                      {practiceRate !== undefined && (
                        <Progress
                          percent={practiceRate}
                          size="small"
                          showInfo={false}
                          strokeColor={practiceRate >= 70 ? '#389e0d' : '#d48806'}
                        />
                      )}
                    </Flex>
                  )}
                </div>
              </div>

              <Flex gap={spacing.xs} style={{ marginTop: spacing.md }}>
                <Button
                  style={{ flex: 1 }}
                  icon={<ArrowRightOutlined />}
                  iconPlacement="end"
                  onClick={() => navigate(`${paths.director.practice}?programId=${program.id}&tab=progress`)}
                >
                  Xem tiến độ
                </Button>
                <Button
                  style={{ flex: 1 }}
                  onClick={() => navigate(`${paths.director.practice}?programId=${program.id}&tab=assign`)}
                >
                  Giao bài tập
                </Button>
              </Flex>
            </Card>
          </Col>

          {/* Step 4: Phân công phục vụ */}
          <Col xs={24} lg={12}>
            <Card
              size="small"
              variant="outlined"
              style={{
                height: '100%',
                borderRadius: radius.md,
                background: '#FAFAFA',
                display: 'flex',
                flexDirection: 'column',
              }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
            >
              <div>
                <Flex align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.sm }}>
                  <Flex align="center" gap={spacing.xs}>
                    <TeamOutlined style={{ color: colors.primary, fontSize: 17 }} />
                    <Typography.Text strong style={{ fontSize: 15 }}>
                      Phân công phục vụ
                    </Typography.Text>
                  </Flex>
                  {!songListApproved ? (
                    <Tag style={{ marginInlineEnd: 0 }}>Chờ duyệt bài hát</Tag>
                  ) : rosterFinalized ? (
                    <Tag color="success" style={{ marginInlineEnd: 0 }}>
                      Đã chốt phân công
                    </Tag>
                  ) : (
                    <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                      Đang phân công
                    </Tag>
                  )}
                </Flex>

                <div style={{ minHeight: 46 }}>
                  {!songListApproved ? (
                    <Typography.Text style={muted}>
                      Yêu cầu danh sách bài hát được Cha xứ phê duyệt trước khi thiết lập phân công.
                    </Typography.Text>
                  ) : (
                    <Flex vertical gap={2}>
                      <Typography.Text style={{ fontSize: 13.5 }}>
                        {rosterFinalized ? 'Đã chốt' : 'Đang phân công'} ·{' '}
                        <strong style={numeric}>{activeAssignments}</strong> lượt ca viên
                      </Typography.Text>
                      {shortages.length > 0 && (
                        <Typography.Text style={{ fontSize: 13 }}>
                          Còn thiếu nhân sự cho <strong style={numeric}>{shortages.length}</strong> vị trí
                        </Typography.Text>
                      )}
                    </Flex>
                  )}
                </div>
              </div>

              <div style={{ marginTop: spacing.md }}>
                <Button
                  block
                  type={songListApproved ? 'primary' : 'default'}
                  icon={<ArrowRightOutlined />}
                  iconPlacement="end"
                  onClick={() => navigate(generatePath(paths.director.roster, {}) + `?programId=${program.id}`)}
                >
                  {songListApproved ? 'Lập & điều chỉnh phân công' : 'Xem trang phân công'}
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </Flex>
  )
}
