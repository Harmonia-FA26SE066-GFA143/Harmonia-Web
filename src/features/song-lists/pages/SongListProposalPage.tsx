import { Alert, App, Button, Flex, Modal, Typography } from 'antd'
import { useState } from 'react'
import { generatePath, useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { canEditSongList, formatProgramDate, isSongListClosed, ProgramInfo, useProgram, type LiturgicalProgram } from '@/features/liturgical-programs'
import type { SongFilters } from '@/features/music-library'
import { useCatalogOptions, type CatalogOption } from '@/features/system-categories'
import { EmptyState, ErrorState, Icon, LostLeaf, PageHeader, PageSkeleton, SaveButton, useJustSaved } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
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
  // Closed once the event is cancelled or its Mass has begun (BE 61b3aa6); the list stays readable.
  const closed = isSongListClosed(program)
  const editable = canEditSongList(list?.status) && !closed
  const [items, setItems] = useState<DraftItem[]>(() => toDraft(list))
  const [dirty, setDirty] = useState(false)
  const [picking, setPicking] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const suggestedFilters = useEventSongFilters(program)
  const [confirming, setConfirming] = useState(false)
  const [justSaved, markSaved] = useJustSaved()

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
          if (!submit) markSaved()
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
    <Button icon={<Icon name="add" />} onClick={() => setPicking(true)}>
      Thêm bài hát từ kho
    </Button>
  )
  const suggestButton = (
    <Button icon={<Icon name="liturgy-tip" />} onClick={() => setSuggesting(true)}>
      Gợi ý bài theo phần
    </Button>
  )
  const takenBySlot = new Map<string, Set<string>>()
  for (const { slotId, songId } of items) if (slotId) takenBySlot.set(slotId, (takenBySlot.get(slotId) ?? new Set()).add(songId))

  return (
    <>
      {/* The list on the left, where it is composed; where it stands, the Mass and the send action on the right (artifact SongListProposalPage). */}
      <div className="hm-split">
        <section className="hm-sheet-section" aria-labelledby="proposal-songs">
          <div className="hm-sheet-section__head ct-sheet-head">
            <h2 id="proposal-songs" className="hm-rubric">{`Danh sách bài hát (${items.length})`}</h2>
            {editable && items.length > 0 && (
              <Flex wrap gap={spacing.sm}>
                {suggestButton}
                {addButton}
              </Flex>
            )}
          </div>
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
        </section>
        <aside className="hm-preview hm-paper" aria-label="Tình trạng và gửi duyệt">
          {closed && (
            <Alert
              type="warning"
              showIcon
              title={program.status === 'cancelled' ? 'Chương trình đã bị hủy' : 'Thánh lễ đã bắt đầu'}
              description="Danh sách bài hát chỉ còn xem, không lưu hay gửi duyệt được nữa."
            />
          )}
          {list && <SongListStatusAlert list={list} />}
          {!list && !closed && (
            // A quiet status, not a second rubric above ProgramInfo's "Thông tin chương trình" (G3-06).
            <Alert
              type="info"
              showIcon
              title="Chưa có đề xuất danh sách bài hát"
              description="Thêm bài hát từ kho hoặc xem gợi ý theo phần phụng vụ rồi gửi Cha xứ duyệt."
            />
          )}
          <ProgramInfo program={program} />
          {editable && (
            <>
              <Flex wrap gap={spacing.sm}>
                <SaveButton
                  saved={justSaved}
                  icon={justSaved ? undefined : <Icon name="save" />}
                  disabled={!dirty || items.length === 0}
                  loading={save.isPending && !confirming}
                  onClick={() => handleSave(false)}
                >
                  Lưu nháp
                </SaveButton>
                <Button type="primary" icon={<Icon name="send" />} disabled={items.length === 0} onClick={() => setConfirming(true)}>
                  Gửi duyệt
                </Button>
              </Flex>
              <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
                Khi lưu, yêu cầu nhân sự của từng bài được điền sẵn theo kho bài hát và phần phụng vụ (ví dụ Đáp ca cần 1 người
                xướng); xem và sửa ở trang Phân công phục vụ.
              </Typography.Text>
            </>
          )}
        </aside>
      </div>

      {picking && (
        <SongPickerDrawer
          listedSongIds={items.map((item) => item.songId)}
          suggestedFilters={suggestedFilters}
          onCancel={() => setPicking(false)}
          onAdd={(songs) => {
            // The same song may be added again for another part, so the row key cannot be the song alone.
            change([...items, ...songs.map((song, index) => ({ key: `new-${song.id}-${items.length + index}`, songId: song.id, songTitle: song.title }))])
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
    <Button icon={<Icon name="arrow-left" />} onClick={() => navigate(generatePath(paths.director.programDetail, { programId }))}>
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
          icon={<LostLeaf />}
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
