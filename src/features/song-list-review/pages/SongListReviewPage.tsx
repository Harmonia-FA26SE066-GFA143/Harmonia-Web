import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons'
import { App, Button, Card, ConfigProvider, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState, type ReactNode } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router'
import { readingTheme } from '@/app/theme'
import { paths } from '@/app/router/paths'
import {
  PreparationSteps,
  ProgramHeader,
  ProgramItemList,
  preparationSteps,
  useEvent,
  useEventNames,
  usePreparationStatus,
  type ProgramItem,
} from '@/features/liturgical-programs'
import { parseUtc } from '@/lib/api/dates'
import { CardTitle, EmptyState, ErrorState, PageHeader, PageSkeleton, SectionSkeleton } from '@/shared/ui'
import { cardSurface, colors, sections, spacing } from '@/styles/tokens'
import { ReviewForm } from '../components/ReviewForm'
import { SongMaterialsDrawer } from '../components/SongMaterialsDrawer'
import { useLatestSongList, useReviewSongList, useSongListVersion } from '../hooks/useSongListReview'
import { reviewErrorMessage } from '../songListReviewErrors'
import { reviewDecisionLabels, type ReviewDecision, type ReviewValues, type SongList, type SongListItem } from '../types'

const breadcrumb = [
  { title: 'Cha xứ' },
  { title: 'Chương trình phụng vụ' },
  { title: 'Chi tiết chương trình' },
  { title: 'Duyệt danh sách bài hát' },
]

const at = (value?: string) => (value ? dayjs(parseUtc(value)).format('HH:mm DD/MM/YYYY') : undefined)

const confirmations: Record<ReviewDecision, { title: string; content: string; ok: string; done: string }> = {
  approve: {
    title: 'Duyệt danh sách bài hát?',
    content: 'Danh sách được khoá sau khi duyệt. Ca trưởng sẽ nhận thông báo.',
    ok: 'Duyệt',
    done: 'Đã duyệt danh sách bài hát.',
  },
  requestRevision: {
    title: 'Yêu cầu Ca trưởng sửa danh sách?',
    content: 'Ca trưởng sẽ nhận thông báo kèm nhận xét và gửi lại một phiên bản mới.',
    ok: 'Gửi yêu cầu sửa',
    done: 'Đã gửi yêu cầu sửa cho Ca trưởng.',
  },
  reject: {
    title: 'Từ chối danh sách bài hát?',
    content: 'Ca trưởng sẽ nhận thông báo kèm lý do và biên soạn một phiên bản mới.',
    ok: 'Từ chối',
    done: 'Đã từ chối danh sách bài hát.',
  },
}

/** Each state is a word and a shape, never colour alone. */
const listStates: Record<SongList['status'], { icon: ReactNode; label: string; color: string }> = {
  draft: { icon: <EditOutlined />, label: 'Bản nháp', color: colors.textMuted },
  submitted: { icon: <ClockCircleOutlined />, label: 'Chờ Cha xứ duyệt', color: sections.attention.ink },
  approved: { icon: <CheckCircleOutlined />, label: 'Đã duyệt', color: colors.primary },
  needsRevision: { icon: <EditOutlined />, label: 'Đã yêu cầu chỉnh sửa', color: colors.textBody },
  rejected: { icon: <CloseCircleOutlined />, label: 'Đã từ chối', color: colors.textBody },
}

const decisionIcons: Record<ReviewDecision, ReactNode> = {
  approve: <CheckCircleOutlined />,
  requestRevision: <EditOutlined />,
  reject: <CloseCircleOutlined />,
}

function ListState({ list }: Readonly<{ list: SongList }>) {
  const state = listStates[list.status]
  const when = list.status === 'submitted' ? at(list.submittedAt) : at(list.decidedAt)
  return (
    <Flex align="center" gap={spacing.sm} wrap role="status">
      <span aria-hidden style={{ color: state.color, fontSize: 18, display: 'inline-flex' }}>
        {state.icon}
      </span>
      <Typography.Text style={{ fontWeight: 600, color: state.color }}>{state.label}</Typography.Text>
      <Typography.Text style={{ color: colors.textMuted }}>
        Phiên bản {list.version}
        {when && ` · ${list.status === 'submitted' ? 'gửi' : 'quyết định'} lúc ${when}`}
        {list.status === 'submitted' && list.version > 1 && ' · bản gửi lại sau lần xem xét trước'}
      </Typography.Text>
    </Flex>
  )
}

/** The decisions on one version and their notes; with earlier versions, headed by its number. */
function VersionDecisions({ list, headed }: Readonly<{ list: SongList; headed: boolean }>) {
  return (
    <section aria-label={`Phiên bản ${list.version}`}>
      {headed && <Typography.Text style={{ display: 'block', fontWeight: 600 }}>{`Phiên bản ${list.version}`}</Typography.Text>}
      {list.reviews.length === 0 ? (
        <Typography.Text style={{ color: colors.textMuted }}>Chưa có quyết định nào cho phiên bản này.</Typography.Text>
      ) : (
        <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {list.reviews.map((review, index) => (
            <li key={review.id} style={{ padding: `${spacing.sm}px 0`, borderTop: index > 0 ? `1px solid ${colors.border}` : undefined }}>
              <Flex align="center" gap={spacing.sm} wrap>
                <span aria-hidden style={{ display: 'inline-flex' }}>
                  {decisionIcons[review.decision]}
                </span>
                <Typography.Text style={{ fontWeight: 600 }}>{reviewDecisionLabels[review.decision]}</Typography.Text>
                <Typography.Text style={{ color: colors.textMuted }}>{at(review.reviewedAt)}</Typography.Text>
              </Flex>
              {review.notes && <Typography.Paragraph style={{ margin: `${spacing.xs}px 0 0`, maxWidth: '72ch' }}>“{review.notes}”</Typography.Paragraph>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/**
 * An earlier version, then the one before it. No endpoint lists an event's versions, so each is read by the
 * `previousVersionId` of the next (one call per version, newest first).
 */
function EarlierVersion({ id }: Readonly<{ id: string }>) {
  const version = useSongListVersion(id)
  const divider = { borderTop: `1px solid ${colors.border}`, paddingTop: spacing.md }
  if (version.isPending) {
    return <Typography.Text style={{ ...divider, display: 'block', color: colors.textMuted }}>Đang tải phiên bản trước…</Typography.Text>
  }
  if (version.isError) {
    return (
      <Flex align="center" gap={spacing.sm} style={divider}>
        <Typography.Text type="danger">Không thể tải phiên bản trước.</Typography.Text>
        <Button size="small" onClick={() => version.refetch()} loading={version.isFetching}>
          Thử lại
        </Button>
      </Flex>
    )
  }
  return (
    <>
      <div style={divider}>
        <VersionDecisions list={version.data} headed />
      </div>
      {version.data.previousVersionId && <EarlierVersion id={version.data.previousVersionId} />}
    </>
  )
}

/** The decisions on this version and on every earlier one, newest first. */
function ReviewHistory({ list }: Readonly<{ list: SongList }>) {
  const earlier = list.previousVersionId
  return (
    <Card style={cardSurface} title={<CardTitle>Lịch sử duyệt</CardTitle>}>
      <Flex vertical gap={spacing.md}>
        <VersionDecisions list={list} headed={Boolean(earlier)} />
        {earlier && <EarlierVersion id={earlier} />}
      </Flex>
    </Card>
  )
}

/** The six steps with the view's one ribbon; the list's own status moves step 2 the moment a decision lands. */
function ReviewSteps({ eventId, date, list }: Readonly<{ eventId: string; date: string; list: SongList }>) {
  const status = usePreparationStatus(eventId)
  if (status.isPending) return <SectionSkeleton rows={2} label="Đang tải tiến trình chuẩn bị" />
  // One source with the program page: the preparation status (newest version, a draft included). Until it reloads
  // after a decision, the decided list's own status moves step 2 at once.
  const decidedHere = list.status !== 'submitted' && status.data?.songListStatus === 'submitted'
  const songListStatus = decidedHere ? list.status : (status.data?.songListStatus ?? list.status)
  const steps = preparationSteps({ date, songListStatus, status: status.data, failed: status.isError, viewer: 'priest' })
  return <PreparationSteps steps={steps} bookmark />
}

/**
 * Priest: the song list the Choir Director submitted, read like a missal page (FE-17–FE-20, `/api/song-lists`): each
 * song in order with its place in the Mass, who wrote it, its materials and the Choir Director's note, the decision
 * history, and three actions while it waits: Duyệt, Yêu cầu sửa, Từ chối (POST review, Parish Priest only). After a
 * decision the page stays, so the bookmark ribbon is seen moving to the next step.
 */
export function SongListReviewPage() {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { programId = '' } = useParams()
  const event = useEvent(programId)
  const latest = useLatestSongList(programId)
  const review = useReviewSongList()
  const { eventName, name } = useEventNames()
  const [viewing, setViewing] = useState<SongListItem>()

  const toProgram = () => navigate(generatePath(paths.priest.programDetail, { programId }))
  const backButton = (
    <Button icon={<ArrowLeftOutlined />} onClick={toProgram}>
      Về chương trình
    </Button>
  )

  if (event.isPending || latest.isPending) {
    return <PageSkeleton sections={2} />
  }

  const failed = event.isError || latest.isError
  const list = latest.data ?? undefined

  const handleReview = (values: ReviewValues) => {
    if (!list) return
    const { title, content, ok, done } = confirmations[values.decision]
    modal.confirm({
      title,
      content,
      okText: ok,
      okButtonProps: { danger: values.decision === 'reject' },
      cancelText: 'Quay lại',
      // Enter on a rejection must not send it.
      autoFocusButton: values.decision === 'reject' ? 'cancel' : 'ok',
      onOk: () =>
        review
          .mutateAsync({ id: list.id, values })
          .then(() => message.success(done))
          .catch((error: Error) => message.error(reviewErrorMessage(error, 'Không thể gửi quyết định. Vui lòng thử lại.'))),
    })
  }

  const byId = new Map(list?.items.map((item) => [item.id, item]))
  const items: ProgramItem[] = (list?.items ?? []).map(({ id, songId, slotName, songTitle, note }) => ({ id, songId, slotName, title: songTitle, note }))

  return (
    <>
      {event.data ? (
        <ProgramHeader
          title={eventName(event.data)}
          date={event.data.date}
          time={event.data.time}
          place={event.data.locationName}
          seasonName={name('season', event.data.seasonId)}
          breadcrumb={breadcrumb}
          actions={backButton}
        />
      ) : (
        <PageHeader title="Duyệt danh sách bài hát" breadcrumb={breadcrumb} extra={backButton} />
      )}
      {failed && (
        <ErrorState
          title="Không thể tải danh sách bài hát"
          onRetry={() => Promise.all([event.refetch(), latest.refetch()])}
          retrying={event.isFetching || latest.isFetching}
        />
      )}
      {!failed && !event.data && (
        <EmptyState
          icon={<FileSearchOutlined />}
          title="Không tìm thấy chương trình phụng vụ"
          description="Chương trình không tồn tại hoặc đường dẫn không đúng."
        />
      )}
      {!failed && event.data && !list && (
        <EmptyState title="Chưa có danh sách bài hát" description="Ca trưởng chưa gửi danh sách bài hát cho sự kiện này." />
      )}
      {!failed && event.data && list && (
        <Flex vertical gap={spacing.lg}>
          <Card style={cardSurface} title={<CardTitle>Tiến trình chuẩn bị</CardTitle>}>
            <ReviewSteps eventId={programId} date={event.data.date} list={list} />
          </Card>
          <ConfigProvider theme={readingTheme}>
            <Card
              style={{ border: cardSurface.border, boxShadow: 'none' }}
              title={<CardTitle>{`Duyệt danh sách bài hát (${list.items.length} bài)`}</CardTitle>}
            >
              <div style={{ marginBottom: spacing.md }}>
                <ListState list={list} />
              </div>
              <ProgramItemList
                items={items}
                renderAction={(item) => (
                  <Button
                    icon={<FolderOpenOutlined />}
                    onClick={() => setViewing(byId.get(item.id))}
                    aria-label={`Xem bản nhạc và tài liệu của ${item.title}`}
                  >
                    Bản nhạc
                  </Button>
                )}
              />
            </Card>
          </ConfigProvider>
          {list.status === 'submitted' && <ReviewForm saving={review.isPending} onSubmit={handleReview} />}
          <ReviewHistory list={list} />
          <SongMaterialsDrawer item={viewing} onClose={() => setViewing(undefined)} />
        </Flex>
      )}
    </>
  )
}
