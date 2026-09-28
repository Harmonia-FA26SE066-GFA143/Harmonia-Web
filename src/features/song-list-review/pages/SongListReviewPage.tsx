import { ArrowLeftOutlined, FileSearchOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Form, Input, Modal, Typography } from 'antd'
import { useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { ProgramInfo, useProgram, type LiturgicalProgram } from '@/features/liturgical-programs'
import {
  SongListStatusAlert,
  useRejectSongList,
  useSongList,
  useSubmitSongReview,
  type SongList,
  type SongReview,
} from '@/features/song-lists'
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { ReviewTable, type ReviewDraft } from '../components/ReviewTable'

const breadcrumb = [
  { title: 'Cha xứ' },
  { title: 'Chương trình phụng vụ' },
  { title: 'Chi tiết chương trình' },
  { title: 'Duyệt danh sách bài hát' },
]

/** Per-song review of a submitted list, whole-list rejection, and the decision summary (decided 2026-09-28). */
function ReviewPanel({ program, list }: { program: LiturgicalProgram; list: SongList }) {
  const { message } = App.useApp()
  const submitReview = useSubmitSongReview(program.id)
  const reject = useRejectSongList(program.id)
  const reviewing = list.status === 'submitted'
  const [draft, setDraft] = useState<ReviewDraft>({})
  const [missingNotes, setMissingNotes] = useState<string[]>([])
  const [generalNote, setGeneralNote] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const undecided = list.items.filter((item) => !draft[item.id]?.decision).length
  const needsRevision = list.items.filter((item) => draft[item.id]?.decision === 'revisionRequested').length

  const openConfirm = () => {
    if (undecided > 0) {
      message.warning(`Còn ${undecided} bài hát chưa có quyết định.`)
      return
    }
    const missing = list.items
      .filter((item) => draft[item.id]?.decision === 'revisionRequested' && !draft[item.id]?.note?.trim())
      .map((item) => item.id)
    setMissingNotes(missing)
    if (missing.length === 0) setConfirming(true)
  }

  const handleSubmit = () => {
    // Every song must carry an explicit decision (checked in openConfirm); nothing is accepted by default.
    const decisions: Record<string, SongReview> = {}
    for (const item of list.items) {
      const entry = draft[item.id]
      if (!entry?.decision) return
      decisions[item.id] = { decision: entry.decision, note: entry.note?.trim() || undefined }
    }
    submitReview.mutate(
      { decisions, note: generalNote.trim() || undefined },
      {
        onSuccess: () => {
          setConfirming(false)
          message.success(needsRevision ? 'Đã gửi yêu cầu chỉnh sửa cho Ca trưởng.' : 'Đã phê duyệt danh sách bài hát.')
        },
        onError: () => message.error('Không thể gửi quyết định. Vui lòng thử lại.'),
      },
    )
  }

  const handleReject = ({ note }: { note: string }) =>
    reject.mutate(note.trim(), {
      onSuccess: () => {
        setRejecting(false)
        message.success('Đã từ chối danh sách bài hát.')
      },
      onError: () => message.error('Không thể từ chối danh sách. Vui lòng thử lại.'),
    })

  return (
    <>
      <Flex vertical gap={spacing.lg}>
        <SongListStatusAlert list={list} viewer="priest" />
        <ProgramInfo program={program} />
        <Card title={`Danh sách bài hát đề xuất (${list.items.length})`} styles={{ body: { padding: 0 } }}>
          <ReviewTable
            items={list.items}
            draft={reviewing ? draft : undefined}
            missingNotes={missingNotes}
            onChange={(itemId, review) => setDraft((current) => ({ ...current, [itemId]: review }))}
          />
        </Card>
        {reviewing && (
          <Card title="Quyết định">
            <Typography.Paragraph>
              Tất cả bài được chấp thuận thì danh sách được phê duyệt; có bài cần chỉnh sửa thì danh sách được trả về
              Ca trưởng để sửa.
            </Typography.Paragraph>
            <Input.TextArea
              rows={3}
              value={generalNote}
              onChange={(event) => setGeneralNote(event.target.value)}
              placeholder="Nhận xét chung gửi Ca trưởng (không bắt buộc)"
              aria-label="Nhận xét chung"
              style={{ marginBottom: spacing.md }}
            />
            <Flex wrap justify="flex-end" gap={spacing.sm}>
              <Button danger onClick={() => setRejecting(true)}>
                Từ chối toàn bộ danh sách
              </Button>
              <Button type="primary" onClick={openConfirm}>
                Gửi quyết định
              </Button>
            </Flex>
          </Card>
        )}
      </Flex>

      <Modal
        open={confirming}
        title={needsRevision ? 'Yêu cầu Ca trưởng chỉnh sửa?' : 'Phê duyệt danh sách bài hát?'}
        okText={needsRevision ? 'Gửi yêu cầu chỉnh sửa' : 'Phê duyệt'}
        cancelText="Hủy"
        okButtonProps={{ loading: submitReview.isPending }}
        cancelButtonProps={{ disabled: submitReview.isPending }}
        onOk={handleSubmit}
        onCancel={() => setConfirming(false)}
      >
        {needsRevision
          ? `${needsRevision}/${list.items.length} bài hát cần chỉnh sửa. Danh sách sẽ được trả về Ca trưởng kèm ghi chú.`
          : `Cả ${list.items.length} bài hát được chấp thuận. Danh sách sẽ được phê duyệt và khoá chỉnh sửa.`}
      </Modal>
      <Modal
        open={rejecting}
        title="Từ chối toàn bộ danh sách?"
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, htmlType: 'submit', loading: reject.isPending }}
        cancelButtonProps={{ disabled: reject.isPending }}
        onCancel={() => setRejecting(false)}
        destroyOnHidden
        modalRender={(dom) => (
          <Form<{ note: string }> layout="vertical" disabled={reject.isPending} onFinish={handleReject}>
            {dom}
          </Form>
        )}
      >
        <Typography.Paragraph>Ca trưởng sẽ biên soạn lại danh sách và gửi duyệt lần mới.</Typography.Paragraph>
        <Form.Item
          label="Lý do từ chối"
          name="note"
          rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập lý do từ chối.' }]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
      </Modal>
    </>
  )
}

/**
 * Priest / Liturgy Committee: review the song list the Choir Director submitted (FE-17–FE-20). The Priest cannot
 * edit the list; the Choir Director cannot review (separate pages).
 */
export function SongListReviewPage() {
  const navigate = useNavigate()
  const { programId = '' } = useParams()
  const program = useProgram(programId)
  const list = useSongList(programId)
  const backButton = (
    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(generatePath(paths.priest.programDetail, { programId }))}>
      Về chương trình
    </Button>
  )

  if (program.isPending || list.isPending) return <PageSkeleton sections={2} />

  return (
    <>
      <PageHeader
        title="Duyệt danh sách bài hát"
        breadcrumb={breadcrumb}
        description={program.data?.eventName}
        extra={backButton}
      />
      {(program.isError || list.isError) && (
        <ErrorState
          title="Không thể tải danh sách bài hát"
          onRetry={() => {
            program.refetch()
            list.refetch()
          }}
          retrying={program.isFetching || list.isFetching}
        />
      )}
      {program.isSuccess && !program.data && (
        <EmptyState
          icon={<FileSearchOutlined />}
          title="Không tìm thấy chương trình phụng vụ"
          description="Chương trình không tồn tại hoặc đường dẫn không đúng."
        />
      )}
      {program.data && list.data && !list.data.status && (
        <EmptyState
          title="Chưa có danh sách bài hát"
          description="Ca trưởng chưa gửi danh sách bài hát cho chương trình này."
          action={backButton}
        />
      )}
      {program.data && list.data?.status && (
        <ReviewPanel
          key={`${list.data.status}-${list.data.submittedAt}-${list.data.reviewedAt}`}
          program={program.data}
          list={list.data}
        />
      )}
    </>
  )
}
