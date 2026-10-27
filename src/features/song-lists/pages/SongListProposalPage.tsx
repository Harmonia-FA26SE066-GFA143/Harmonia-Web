import { ArrowLeftOutlined, BulbOutlined, FileSearchOutlined, PlusOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Modal, Typography } from 'antd'
import { useState } from 'react'
import { generatePath, useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { canEditSongList, formatProgramDate, ProgramInfo, useProgram, type LiturgicalProgram } from '@/features/liturgical-programs'
import type { SongFilters } from '@/features/music-library'
import { useCatalogOptions, type CatalogOption } from '@/features/system-categories'
import { CardTitle, EmptyState, ErrorState, PageHeader, PageSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { ProposalTable, type DraftItem } from '../components/ProposalTable'
import { SongListStatusAlert } from '../components/SongListStatusAlert'
import { SongPickerDrawer } from '../components/SongPickerDrawer'
import { SongSuggestionDrawer } from '../components/SongSuggestionDrawer'
import { useSaveSongList, useSongList } from '../hooks/useSongList'
import { songListErrorMessage } from '../songListErrors'
import type { SongList } from '../types'

const breadcrumb = [
  { title: 'Ca trưởng' },
  { title: 'Chương trình phụng vụ' },
  { title: 'Chi tiết chương trình' },
  { title: 'Đề xuất danh sách bài hát' },
]

const toDraft = (list: SongList | null): DraftItem[] =>
  (list?.items ?? []).map(({ id, songId, songTitle, slotId, slotName, note }) => ({ key: id, songId, songTitle, slotId, slotName, note }))

/**
 * The event's classification as library filters. The event carries catalog names only (`MemberEventDetailDto`); a
 * name is unique within its catalog, switched-off entries included, so it finds the id. An entry no longer listed
 * is simply not suggested.
 */
function useEventSongFilters(program: LiturgicalProgram): SongFilters {
  const seasons = useCatalogOptions('seasons')
  const massTypes = useCatalogOptions('massTypes')
  const ceremonyTypes = useCatalogOptions('ceremonyTypes')
  const idOf = (options: CatalogOption[], name?: string) => (name ? options.find((option) => option.label === name)?.value : undefined)
  return {
    search: '',
    seasonId: idOf(seasons, program.seasonName),
    massTypeId: idOf(massTypes, program.massTypeName),
    ceremonyTypeId: idOf(ceremonyTypes, program.ceremonyTypeName),
  }
}

/** Composes, saves and submits the list; editable while there is none, as a draft, and after rejection or a revision request. */
function ProposalEditor({ program, list }: Readonly<{ program: LiturgicalProgram; list: SongList | null }>) {
  const { message } = App.useApp()
  const save = useSaveSongList(program.id, list)
  const editable = canEditSongList(list?.status)
  const [items, setItems] = useState<DraftItem[]>(() => toDraft(list))
  const [dirty, setDirty] = useState(false)
  const [picking, setPicking] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const suggestedFilters = useEventSongFilters(program)
  const [confirming, setConfirming] = useState(false)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname,
  )
  useBeforeUnload((event) => {
    if (dirty) event.preventDefault()
  })

  const change = (next: DraftItem[]) => {
    setItems(next)
    setDirty(true)
  }

  const handleSave = (submit: boolean) => {
    if (items.some((item) => !item.slotId)) {
      setConfirming(false)
      message.warning('Chọn phần phụng vụ cho mọi bài hát trước khi lưu.')
      return
    }
    save.mutate(
      { items: items.map(({ songId, slotId = '', note }) => ({ songId, slotId, note })), submit },
      {
        onSuccess: () => {
          setDirty(false)
          setConfirming(false)
          message.success(submit ? 'Đã gửi danh sách bài hát để duyệt.' : 'Đã lưu bản nháp.')
        },
        onError: (error) => {
          setConfirming(false)
          message.error(songListErrorMessage(error, submit ? 'Không thể gửi danh sách. Vui lòng thử lại.' : 'Không thể lưu bản nháp. Vui lòng thử lại.'))
        },
      },
    )
  }

  const addButton = (
    <Button icon={<PlusOutlined />} onClick={() => setPicking(true)}>
      Thêm bài hát từ kho
    </Button>
  )
  const suggestButton = (
    <Button icon={<BulbOutlined />} onClick={() => setSuggesting(true)}>
      Gợi ý bài theo phần
    </Button>
  )
  const takenBySlot = new Map<string, Set<string>>()
  for (const { slotId, songId } of items) if (slotId) takenBySlot.set(slotId, (takenBySlot.get(slotId) ?? new Set()).add(songId))

  return (
    <>
      <Flex vertical gap={spacing.lg}>
        {list && <SongListStatusAlert list={list} />}
        <ProgramInfo program={program} />
        <Card
          title={<CardTitle>{`Danh sách bài hát (${items.length})`}</CardTitle>}
          extra={
            editable && (
              <Flex wrap gap={spacing.sm}>
                {suggestButton}
                {addButton}
                <Button
                  icon={<SaveOutlined />}
                  disabled={!dirty || items.length === 0}
                  loading={save.isPending && !confirming}
                  onClick={() => handleSave(false)}
                >
                  Lưu nháp
                </Button>
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
              headingLevel={3}
              title="Chưa có bài hát nào trong đề xuất"
              description="Chọn các bài hát phù hợp từ kho bài hát của ca đoàn rồi gán phần phụng vụ cho từng bài; một phần có thể có nhiều bài."
              action={
                editable ? (
                  <Flex wrap justify="center" gap={spacing.sm}>
                    {suggestButton}
                    {addButton}
                  </Flex>
                ) : undefined
              }
            />
          )}
        </Card>
        {editable && items.length > 0 && (
          <Typography.Text style={{ color: colors.textMuted }}>
            Khi lưu, yêu cầu nhân sự của từng bài được điền sẵn theo kho bài hát và phần phụng vụ (ví dụ Đáp ca cần 1 người
            xướng); xem và sửa ở trang Phân công phục vụ.
          </Typography.Text>
        )}
      </Flex>

      {picking && (
        <SongPickerDrawer
          excludedSongIds={items.map((item) => item.songId)}
          suggestedFilters={suggestedFilters}
          onCancel={() => setPicking(false)}
          onAdd={(songs) => {
            change([...items, ...songs.map((song) => ({ key: `new-${song.id}`, songId: song.id, songTitle: song.title }))])
            setPicking(false)
          }}
        />
      )}
      {suggesting && (
        <SongSuggestionDrawer
          programId={program.id}
          takenBySlot={takenBySlot}
          onCancel={() => setSuggesting(false)}
          onAdd={(slot, songs) => {
            change([
              ...items,
              ...songs.map((song) => ({
                key: `new-${slot.id}-${song.songId}`,
                songId: song.songId,
                songTitle: song.title,
                slotId: slot.id,
                slotName: slot.name,
              })),
            ])
            setSuggesting(false)
          }}
        />
      )}
      <Modal
        open={confirming}
        title="Gửi danh sách bài hát để duyệt?"
        okText="Gửi duyệt"
        cancelText="Hủy"
        okButtonProps={{ loading: save.isPending }}
        cancelButtonProps={{ disabled: save.isPending }}
        onOk={() => handleSave(true)}
        onCancel={() => setConfirming(false)}
      >
        <Typography.Paragraph style={{ margin: 0 }}>
          {items.length} bài hát cho “{program.eventName}” ({formatProgramDate(program.date)}) sẽ được gửi Cha xứ xem xét.
          Trong lúc chờ duyệt, danh sách chỉ xem.
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
        Các thay đổi chưa lưu sẽ mất.
      </Modal>
    </>
  )
}

/** Choir Director: propose, save, submit and revise the song list of a program (FE-30–FE-32). */
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
          description="Chương trình không tồn tại, đã bị hủy hoặc đường dẫn không đúng."
        />
      )}
      {program.data && list.isSuccess && (
        <ProposalEditor key={`${list.data?.id}-${list.data?.status}`} program={program.data} list={list.data} />
      )}
    </>
  )
}
