import { ArrowLeftOutlined, FileSearchOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Modal, Typography } from 'antd'
import { useRef, useState } from 'react'
import { generatePath, useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { canEditSongList, formatProgramDate, ProgramInfo, useProgram, type LiturgicalProgram } from '@/features/liturgical-programs'
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { ProposalTable, type DraftItem } from '../components/ProposalTable'
import { SongListStatusAlert } from '../components/SongListStatusAlert'
import { SongPickerModal } from '../components/SongPickerModal'
import { useSongList, useSubmitSongList } from '../hooks/useSongList'
import type { SongList } from '../types'

const breadcrumb = [
  { title: 'Ca trưởng' },
  { title: 'Chương trình phụng vụ' },
  { title: 'Chi tiết chương trình' },
  { title: 'Đề xuất danh sách bài hát' },
]

function toDraft(list: SongList): DraftItem[] {
  return list.items.map(({ id, songId, title, liturgicalPart, directorNote, review }) => ({
    key: id,
    songId,
    title,
    liturgicalPart,
    directorNote,
    review,
  }))
}

/** Composes and submits the list; editable except while waiting for review and after approval. */
function ProposalEditor({ program, list }: { program: LiturgicalProgram; list: SongList }) {
  const { message } = App.useApp()
  const submit = useSubmitSongList(program.id)
  const editable = canEditSongList(list.status)
  const [items, setItems] = useState<DraftItem[]>(() => toDraft(list))
  const [dirty, setDirty] = useState(false)
  const [picking, setPicking] = useState(false)
  const [confirming, setConfirming] = useState(false)
  // Set once submitted so the list refresh does not trigger the leave warning.
  const submitted = useRef(false)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && !submitted.current && currentLocation.pathname !== nextLocation.pathname,
  )
  useBeforeUnload((event) => {
    if (dirty && !submitted.current) event.preventDefault()
  })

  const change = (next: DraftItem[]) => {
    setItems(next)
    setDirty(true)
  }

  const handleSubmit = () =>
    submit.mutate(
      items.map(({ songId, title, liturgicalPart, directorNote }) => ({
        songId,
        title,
        liturgicalPart: liturgicalPart?.trim() || undefined,
        directorNote: directorNote?.trim() || undefined,
      })),
      {
        onSuccess: () => {
          submitted.current = true
          setConfirming(false)
          message.success('Đã gửi danh sách bài hát để duyệt.')
        },
        onError: () => message.error('Không thể gửi danh sách. Vui lòng thử lại.'),
      },
    )

  const addButton = (
    <Button icon={<PlusOutlined />} onClick={() => setPicking(true)}>
      Thêm bài hát từ kho
    </Button>
  )

  return (
    <>
      <Flex vertical gap={spacing.lg}>
        <SongListStatusAlert list={list} viewer="director" />
        <ProgramInfo program={program} />
        <Card
          title={`Danh sách bài hát (${items.length})`}
          extra={
            editable && (
              <Flex wrap gap={spacing.sm}>
                {addButton}
                <Button type="primary" icon={<SendOutlined />} disabled={items.length === 0} onClick={() => setConfirming(true)}>
                  Gửi duyệt
                </Button>
              </Flex>
            )
          }
          styles={{ body: { padding: items.length > 0 ? 0 : spacing.lg } }}
        >
          {items.length > 0 ? (
            <ProposalTable items={items} editable={editable} onChange={change} />
          ) : (
            <EmptyState
              title="Chưa có bài hát nào trong đề xuất"
              description="Chọn các bài hát phù hợp từ kho bài hát của ca đoàn."
              action={editable ? addButton : undefined}
            />
          )}
        </Card>
      </Flex>

      <SongPickerModal
        open={picking}
        excludedSongIds={items.map((item) => item.songId)}
        onCancel={() => setPicking(false)}
        onAdd={(songs) => {
          change([...items, ...songs.map((song) => ({ key: `new-${song.id}`, songId: song.id, title: song.title }))])
          setPicking(false)
        }}
      />
      <Modal
        open={confirming}
        title="Gửi danh sách bài hát để duyệt?"
        okText="Gửi duyệt"
        cancelText="Hủy"
        okButtonProps={{ loading: submit.isPending }}
        cancelButtonProps={{ disabled: submit.isPending }}
        onOk={handleSubmit}
        onCancel={() => setConfirming(false)}
      >
        <Typography.Paragraph style={{ margin: 0 }}>
          {items.length} bài hát cho “{program.eventName}” ({formatProgramDate(program.date)}) sẽ được gửi Cha xứ / Ban
          phụng vụ xem xét. Trong lúc chờ duyệt, danh sách chỉ xem.
        </Typography.Paragraph>
      </Modal>
      <Modal
        open={blocker.state === 'blocked'}
        title="Rời khỏi trang đề xuất?"
        okText="Rời khỏi trang"
        cancelText="Ở lại"
        okButtonProps={{ danger: true }}
        onOk={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        Các thay đổi chưa gửi duyệt sẽ không được lưu.
      </Modal>
    </>
  )
}

/**
 * Choir Director: propose, submit and revise the song list of a program (FE-30–FE-32). Saving a draft without
 * submitting is not defined (TBD): changes stay on the page until they are submitted.
 */
export function SongListProposalPage() {
  const navigate = useNavigate()
  const { programId = '' } = useParams()
  const program = useProgram(programId)
  const list = useSongList(programId)
  const backButton = (
    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(generatePath(paths.director.programDetail, { programId }))}>
      Về chương trình
    </Button>
  )

  if (program.isPending || list.isPending) return <PageSkeleton sections={2} />

  return (
    <>
      <PageHeader
        title="Đề xuất danh sách bài hát"
        breadcrumb={breadcrumb}
        description={program.data ? program.data.eventName : undefined}
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
      {program.data && list.data && (
        <ProposalEditor
          key={`${list.data.status}-${list.data.submittedAt}-${list.data.reviewedAt}`}
          program={program.data}
          list={list.data}
        />
      )}
    </>
  )
}
