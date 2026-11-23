import { App, Button, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { parseUtc } from '@/lib/api/dates'
import { ApiError, requestFailureMessage } from '@/lib/api/errors'
import { useBackgroundTasks } from '@/shared/tasks/BackgroundTasks'
import { CREATE_ASSIGNMENT_LABEL, EmptyState, ErrorState, Icon, LostLeaf, PageHeader, PageSkeleton, SectionSkeleton } from '@/shared/ui'
import { colors } from '@/styles/tokens'
import { LearningProgressDrawer } from '../components/LearningProgressDrawer'
import { SongClassificationPanel } from '../components/SongClassificationPanel'
import { SongClassificationDrawer } from '../components/SongClassificationDrawer'
import { SongFormDrawer } from '../components/SongFormDrawer'
import { SongInfoPanel } from '../components/SongInfoPanel'
import { SongMaterialsPanel } from '../components/SongMaterialsPanel'
import { SongUsagePanel } from '../components/SongUsagePanel'
import { ReplaceMaterialFileDrawer } from '../components/ReplaceMaterialFileDrawer'
import { TimedLyricsDrawer } from '../components/TimedLyricsDrawer'
import { UploadMaterialDrawer, type MaterialFormValues, type PendingMaterial } from '../components/UploadMaterialDrawer'
import {
  useDeleteMaterial,
  useDeleteSong,
  useSaveSong,
  useSaveSongClassification,
  useSong,
  useSongClassification,
  useReplaceMaterialFile,
  useSongMaterials,
  useUpdateMaterial,
  useUploadMaterial,
} from '../hooks/useSongs'
import { getLatestLyricsExtraction } from '../api/songsApi'
import { extractKeyPrefix, isOpenJob, lyricsExtractionTask, wasSeen } from '../lyricsExtraction'
import { readLyricsDraft, removeLyricsDraft } from '../lyricsDraft'
import { listSearchOf } from '../songFilters'
import {
  classificationErrorMessage,
  duplicateTitleMessage,
  isDuplicateTitle,
  materialFileProblem,
  materialUpdateErrorMessage,
  uploadErrorMessage,
} from '../songErrors'
import {
  materialKindLabels,
  type MaterialKind,
  type PlaybackInstrument,
  type SongClassificationValues,
  type SongMaterial,
  type SongValues,
} from '../types'


const breadcrumb = [{ title: 'Ca trưởng' }, { title: 'Kho bài hát' }, { title: 'Chi tiết bài hát' }]

/**
 * Choir Director: one song with its fields, FE-29 classification and FE-08/FE-28 materials, their learning progress
 * (FE-09) and deletion of the song. The backend refuses to delete a song any song list, rehearsal or practice
 * assignment uses (409 SONG_IN_USE, BE 718696c), as "only if never selected for a Mass" (song-approval.md, 5a.5) asks.
 * Materials fill the main column; the song's facts and classification sit beside them, each with its own loading, empty
 * and error states. Old `?tab=` links still land here.
 */

export function SongDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { message, modal } = App.useApp()
  const { songId = '' } = useParams()
  const song = useSong(songId)
  const classification = useSongClassification(songId)
  const materials = useSongMaterials(songId)
  const save = useSaveSong()
  const saveClassification = useSaveSongClassification(songId)
  const upload = useUploadMaterial(songId)
  const remove = useDeleteMaterial(songId)
  const updateMaterial = useUpdateMaterial(songId)
  const replaceFile = useReplaceMaterialFile(songId)
  const tasks = useBackgroundTasks()
  const [params, setParams] = useSearchParams()
  const deleteSong = useDeleteSong()
  const [editingMaterial, setEditingMaterial] = useState<SongMaterial>()
  const [replacing, setReplacing] = useState<SongMaterial>()
  const [progressOf, setProgressOf] = useState<SongMaterial>()
  const [timing, setTiming] = useState<SongMaterial>()
  const [editing, setEditing] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [titleError, setTitleError] = useState<string>()
  const [picked, setPicked] = useState<PendingMaterial>()
  // The sheet the open lyrics draft came from; its stored draft is removed once the lyrics are saved.
  const [draftOf, setDraftOf] = useState<string>()
  const checkedSheets = useRef(new Set<string>())
  const songTitle = song.data?.title
  const { start: startTask } = tasks
  useEffect(() => {
    if (!songTitle) return
    for (const sheet of materials.data ?? []) {
      if (sheet.kind !== 'sheetMusic' || !sheet.url || checkedSheets.current.has(sheet.id)) continue
      checkedSheets.current.add(sheet.id)
      getLatestLyricsExtraction(sheet.id)
        .then((job) => {
          if (job && (isOpenJob(job) || (job.status === 'Succeeded' && !wasSeen(job.id)))) {
            startTask(lyricsExtractionTask(songId, songTitle, sheet, job.id))
          }
        })
        // Nothing to pick up is the usual case; a failed check only means no reminder.
        .catch(() => undefined)
    }
  }, [materials.data, songId, songTitle, startTask])
  const extractingIds = new Set(
    tasks.tasks
      .filter((task) => task.status === 'running' && task.key.startsWith(extractKeyPrefix))
      .map((task) => task.key.slice(extractKeyPrefix.length)),
  )

  // "Mở bản nháp" (task notification or list) comes back here with ?draft=<materialId>: open the lyrics form with it.
  const draftParam = params.get('draft')
  useEffect(() => {
    if (!draftParam || songTitle === undefined) return
    const text = readLyricsDraft(songId, draftParam)
    if (text) {
      // The draft lives in sessionStorage and the URL, outside React: opening it is a sync with them.
      // oxlint-disable-next-line react/set-state-in-effect
      setPicked({ kind: 'lyrics', lyricsText: text, title: `Lời ${songTitle}`.slice(0, 200) })
      setDraftOf(draftParam)
    } else message.info('Bản nháp lời đã hết hạn hoặc không còn. Bạn có thể trích lời lại.')
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('draft')
        return next
      },
      { replace: true },
    )
  }, [draftParam, songTitle, songId, message, setParams])

  const backButton = (
    // The list's filters and page travel with the song (router state), so coming back shows the list as it was.
    <Button icon={<Icon name="arrow-left" />} onClick={() => navigate(`${paths.director.library}${listSearchOf(location.state)}`)}>
      Về kho bài hát
    </Button>
  )

  if (song.isPending) return <PageSkeleton sections={3} />
  if (!song.data) {
    return (
      <>
        <PageHeader title="Chi tiết bài hát" breadcrumb={breadcrumb} extra={backButton} />
        {song.isError ? (
          <ErrorState title="Không thể tải bài hát" error={song.error} hasData={song.data !== undefined} onRetry={() => song.refetch()} retrying={song.isFetching} />
        ) : (
          <EmptyState
            icon={<LostLeaf />}
            title="Không tìm thấy bài hát"
            description="Bài hát không tồn tại, đã bị xoá hoặc đường dẫn không đúng."
            action={backButton}
          />
        )}
      </>
    )
  }

  const { data } = song
  // Key metadata in place of a description sentence; the side panel has every field.
  const metadata = [data.musicalKey && `Giọng ${data.musicalKey}`, data.composer && `Nhạc: ${data.composer}`, data.lyricist && `Lời: ${data.lyricist}`]
    .filter(Boolean)
    .join(' · ')

  const closeForm = () => {
    setEditing(false)
    setTitleError(undefined)
  }

  const handleSave = (values: SongValues) => {
    if (save.isPending) return
    setTitleError(undefined)
    save.mutate(
      { id: data.id, values },
      {
        onSuccess: () => {
          message.success('Đã lưu thay đổi.')
          closeForm()
        },
        onError: (error) =>
          isDuplicateTitle(error)
            ? setTitleError(duplicateTitleMessage)
            : message.error(requestFailureMessage(error, 'Không thể lưu bài hát. Vui lòng thử lại.')),
      },
    )
  }

  const handleClassify = (values: SongClassificationValues) => {
    if (saveClassification.isPending) return
    saveClassification.mutate(values, {
      onSuccess: () => {
        message.success('Đã lưu phân loại.')
        setClassifying(false)
      },
      onError: (error) => message.error(classificationErrorMessage(error)),
    })
  }

  const handlePick = (kind: MaterialKind, file: File) => {
    const problem = materialFileProblem(kind, file)
    if (problem) message.error(problem)
    else setPicked({ kind, file })
  }

  const lyricsTitle = `Lời ${data.title}`.slice(0, 200)

  // A server job: the Director may leave this page or reload it while the AI reads. The draft waits in this tab (never
  // saved as a material) until opened from the notification.
  const handleExtractLyrics = (material: SongMaterial) => {
    if (tasks.start(lyricsExtractionTask(songId, data.title, material))) {
      message.info('Đang trích lời. Bạn có thể chuyển trang hoặc tải lại trang, Harmonia sẽ báo khi xong.')
    }
  }

  const handleUpload = (values: MaterialFormValues) => {
    if (!picked || upload.isPending) return
    const { kind, file } = picked
    upload.mutate(
      { kind, file, ...values },
      {
        onSuccess: () => {
          message.success(file ? `Đã tải lên ${materialKindLabels[kind].toLowerCase()}.` : 'Đã lưu lời bài hát.')
          setPicked(undefined)
          if (draftOf) removeLyricsDraft(songId, draftOf)
          setDraftOf(undefined)
        },
        onError: (error) => message.error(uploadErrorMessage(error)),
      },
    )
  }

  const handleUpdateMaterial = ({ title, targetSkillId, lyricsText }: MaterialFormValues) => {
    if (!editingMaterial || updateMaterial.isPending) return
    updateMaterial.mutate(
      { id: editingMaterial.id, values: { title, targetSkillId, lyricsText } },
      {
        onSuccess: () => {
          message.success('Đã lưu tài liệu.')
          setEditingMaterial(undefined)
        },
        onError: (error) => message.error(materialUpdateErrorMessage(error)),
      },
    )
  }

  const handleReplaceFile = (file: File, resetProgress: boolean, instrument?: PlaybackInstrument) => {
    if (!replacing || replaceFile.isPending) return
    replaceFile.mutate(
      { id: replacing.id, file, resetProgress, instrument },
      {
        onSuccess: () => {
          message.success(resetProgress ? 'Đã thay file và xoá tiến độ học của ca viên.' : 'Đã thay file tài liệu.')
          setReplacing(undefined)
        },
        // The same refusals as an upload (type, size, storage), plus a material deleted meanwhile.
        onError: (error) =>
          message.error(
            error instanceof ApiError && error.code === 'MATERIAL_NOT_FOUND'
              ? 'Tài liệu không còn tồn tại. Vui lòng tải lại trang.'
              : uploadErrorMessage(error),
          ),
      },
    )
  }

  const handleDeleteSong = () =>
    modal.confirm({
      title: `Xoá bài hát “${data.title}”?`,
      content: 'Bài hát sẽ không còn trong kho bài hát. Bài đã có trong danh sách bài hát, buổi tập hoặc bài tập thì không xoá được.',
      okText: 'Xoá bài hát',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      // Enter on a destructive dialog must not delete.
      focusable: { autoFocusButton: 'cancel' },
      onOk: () =>
        deleteSong
          .mutateAsync(data.id)
          .then(() => {
            message.success(`Đã xoá “${data.title}” khỏi kho bài hát.`)
            navigate(paths.director.library)
          })
          // 404 SONG_NOT_FOUND: someone deleted it already.
          .catch((error: Error) =>
            message.error(
              error instanceof ApiError && error.code === 'SONG_IN_USE'
                ? 'Bài hát đã được dùng trong danh sách bài hát, buổi tập hoặc bài tập nên không xoá được.'
                : requestFailureMessage(error, 'Không thể xoá bài hát. Vui lòng tải lại trang rồi thử lại.'),
            ),
          ),
    })

  const handleDelete = (material: SongMaterial) =>
    modal.confirm({
      title: `Xoá tài liệu “${material.title}”?`,
      content: `${materialKindLabels[material.kind]}, tải lên ${dayjs(parseUtc(material.createdAt)).format('DD/MM/YYYY')}, sẽ bị xoá khỏi bài hát “${data.title}”.`,
      okText: 'Xoá tài liệu',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      focusable: { autoFocusButton: 'cancel' },
      onOk: () =>
        remove
          .mutateAsync(material.id)
          .then(() => message.success('Đã xoá tài liệu.'))
          .catch((error: Error) => message.error(requestFailureMessage(error, 'Không thể xoá tài liệu. Vui lòng thử lại.'))),
    })

  return (
    <>
      <PageHeader
        title={data.title}
        breadcrumb={breadcrumb}
        description={metadata || undefined}
        extra={
          <>
            {backButton}
            {/* Straight to the assignment form with the song picked; PracticePage's ?tab=assign only redirects there. */}
            <Button icon={<Icon name="assignment" />} onClick={() => navigate(`${paths.director.practiceNew}?songId=${data.id}`)}>
              {CREATE_ASSIGNMENT_LABEL}
            </Button>
            <Button danger icon={<Icon name="delete" />} onClick={handleDeleteSong}>
              Xoá bài hát
            </Button>
            <Button type="primary" icon={<Icon name="edit" />} onClick={() => setEditing(true)}>
              Chỉnh sửa
            </Button>
          </>
        }
      />
      {song.isError && (
        <ErrorState title="Không thể cập nhật bài hát" error={song.error} hasData onRetry={() => song.refetch()} retrying={song.isFetching} />
      )}
      {/* Materials to read, hear and manage on the left; the song's facts and classification beside them (artifact SongDetailPage). */}
      <div className="hm-split">
        <section className="hm-sheet-section" aria-labelledby="song-materials">
          <div className="hm-sheet-section__head">
            <h2 id="song-materials" className="hm-rubric">{materials.data ? `Tài liệu (${materials.data.length})` : 'Tài liệu'}</h2>
          </div>
          <div className="ct-sheet-body">
            <Typography.Paragraph style={{ color: colors.textMuted }}>
              Xem bản nhạc, đọc lời ca và nghe audio. Tài liệu được sắp theo từng nhóm bên dưới.
            </Typography.Paragraph>
            {materials.isPending && <SectionSkeleton rows={3} label="Đang tải tài liệu" />}
            {materials.isError && (
              <ErrorState headingLevel={3} title="Không thể tải tài liệu" error={materials.error} hasData={materials.data !== undefined} onRetry={() => materials.refetch()} retrying={materials.isFetching} />
            )}
            {materials.data !== undefined && (
              <SongMaterialsPanel
                readingLayout
                materials={materials.data}
                uploadingKind={upload.isPending && picked?.file ? picked.kind : undefined}
                onPick={handlePick}
                onTypeLyrics={() => setPicked({ kind: 'lyrics', title: lyricsTitle })}
                onExtractLyrics={handleExtractLyrics}
                extractingIds={extractingIds}
                onDelete={handleDelete}
                onEdit={setEditingMaterial}
                onReplace={setReplacing}
                onProgress={setProgressOf}
                onTimedLyrics={setTiming}
              />
            )}
          </div>
        </section>
        <aside className="ct-aside" aria-label="Thông tin, nơi dùng và phân loại">
          <section className="hm-preview hm-paper" aria-labelledby="song-info">
            <h2 id="song-info" className="hm-rubric">Thông tin bài hát</h2>
            <SongInfoPanel song={data} />
          </section>
          <section className="hm-sheet-section" aria-labelledby="song-usage">
            <div className="hm-sheet-section__head">
              <h2 id="song-usage" className="hm-rubric">Nơi bài hát được dùng</h2>
            </div>
            <div className="ct-sheet-body">
              <SongUsagePanel song={data} />
            </div>
          </section>
          <section className="hm-sheet-section" aria-labelledby="song-classification">
            <div className="hm-sheet-section__head">
              <h2 id="song-classification" className="hm-rubric">Phân loại</h2>
              <Button type="link" icon={<Icon name="edit" />} disabled={!classification.data} onClick={() => setClassifying(true)}>
                Sửa phân loại
              </Button>
            </div>
            <div className="ct-sheet-body">
              <SongClassificationPanel
                classification={classification.data}
                loading={classification.isPending}
                failed={classification.isError}
                error={classification.error}
                hasData={classification.data !== undefined}
                onRetry={() => classification.refetch()}
              />
            </div>
          </section>
        </aside>
      </div>

      <SongFormDrawer
        open={editing}
        song={data}
        saving={save.isPending}
        titleError={titleError}
        onSubmit={handleSave}
        onCancel={closeForm}
      />
      <UploadMaterialDrawer
        pending={picked}
        saving={upload.isPending}
        onSubmit={handleUpload}
        onCancel={() => setPicked(undefined)}
      />
      <UploadMaterialDrawer
        material={editingMaterial}
        saving={updateMaterial.isPending}
        onSubmit={handleUpdateMaterial}
        onCancel={() => setEditingMaterial(undefined)}
      />
      <ReplaceMaterialFileDrawer
        material={replacing}
        saving={replaceFile.isPending}
        onSubmit={handleReplaceFile}
        onCancel={() => setReplacing(undefined)}
      />
      <LearningProgressDrawer material={progressOf} onClose={() => setProgressOf(undefined)} />
      <TimedLyricsDrawer material={timing} materials={materials.data ?? []} onClose={() => setTiming(undefined)} />
      {classification.data && (
        <SongClassificationDrawer
          open={classifying}
          classification={classification.data}
          saving={saveClassification.isPending}
          onSubmit={handleClassify}
          onCancel={() => setClassifying(false)}
        />
      )}
    </>
  )
}
