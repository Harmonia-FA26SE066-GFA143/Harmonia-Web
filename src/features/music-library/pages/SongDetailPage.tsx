import { ArrowLeftOutlined, EditOutlined, FileSearchOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Modal, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { parseUtc } from '@/lib/api/dates'
import { EmptyState, ErrorState, PageHeader, PageSkeleton, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { SongClassificationCard } from '../components/SongClassificationCard'
import { SongClassificationModal } from '../components/SongClassificationModal'
import { SongFormModal } from '../components/SongFormModal'
import { SongInfoCard } from '../components/SongInfoCard'
import { SongMaterialsCard } from '../components/SongMaterialsCard'
import { UploadMaterialModal } from '../components/UploadMaterialModal'
import {
  useDeleteMaterial,
  useSaveSong,
  useSaveSongClassification,
  useSong,
  useSongClassification,
  useSongMaterials,
  useUploadMaterial,
} from '../hooks/useSongs'
import {
  classificationErrorMessage,
  duplicateTitleMessage,
  isDuplicateTitle,
  materialFileProblem,
  uploadErrorMessage,
} from '../songErrors'
import {
  materialKindLabels,
  type MaterialKind,
  type SongClassificationValues,
  type SongMaterial,
  type SongValues,
} from '../types'

const breadcrumb = [{ title: 'Ca trưởng' }, { title: 'Kho bài hát' }, { title: 'Chi tiết bài hát' }]

/** Choir Director: one song with its fields, FE-29 classification and FE-08/FE-28 materials. */
export function SongDetailPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { songId = '' } = useParams()
  const song = useSong(songId)
  const classification = useSongClassification(songId)
  const materials = useSongMaterials(songId)
  const save = useSaveSong()
  const saveClassification = useSaveSongClassification(songId)
  const upload = useUploadMaterial(songId)
  const remove = useDeleteMaterial(songId)
  const [editing, setEditing] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [titleError, setTitleError] = useState<string>()
  const [deleting, setDeleting] = useState<SongMaterial>()
  const [picked, setPicked] = useState<{ kind: MaterialKind; file: File }>()

  const backButton = (
    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.director.library)}>
      Về kho bài hát
    </Button>
  )

  if (song.isPending) return <PageSkeleton sections={3} />
  if (song.isError || !song.data) {
    return (
      <>
        <PageHeader title="Chi tiết bài hát" breadcrumb={breadcrumb} extra={backButton} />
        {song.isError ? (
          <ErrorState title="Không thể tải bài hát" onRetry={() => song.refetch()} retrying={song.isFetching} />
        ) : (
          <EmptyState
            icon={<FileSearchOutlined />}
            title="Không tìm thấy bài hát"
            description="Bài hát không tồn tại, đã bị xoá hoặc đường dẫn không đúng."
            action={backButton}
          />
        )}
      </>
    )
  }

  const { data } = song

  const closeForm = () => {
    setEditing(false)
    setTitleError(undefined)
  }

  const handleSave = (values: SongValues) => {
    setTitleError(undefined)
    save.mutate(
      { id: data.id, values },
      {
        onSuccess: () => {
          message.success('Đã lưu thay đổi.')
          closeForm()
        },
        onError: (error) =>
          isDuplicateTitle(error) ? setTitleError(duplicateTitleMessage) : message.error('Không thể lưu bài hát. Vui lòng thử lại.'),
      },
    )
  }

  const handleClassify = (values: SongClassificationValues) =>
    saveClassification.mutate(values, {
      onSuccess: () => {
        message.success('Đã lưu phân loại.')
        setClassifying(false)
      },
      onError: (error) => message.error(classificationErrorMessage(error)),
    })

  const handlePick = (kind: MaterialKind, file: File) => {
    const problem = materialFileProblem(kind, file)
    if (problem) message.error(problem)
    else setPicked({ kind, file })
  }

  const handleUpload = (values: { title: string; targetSkillId?: string }) => {
    if (!picked) return
    const { kind, file } = picked
    upload.mutate(
      { kind, file, ...values },
      {
        onSuccess: () => {
          message.success(`Đã tải lên ${materialKindLabels[kind].toLowerCase()}.`)
          setPicked(undefined)
        },
        onError: (error) => message.error(uploadErrorMessage(error)),
      },
    )
  }

  const handleDelete = () => {
    if (!deleting) return
    remove.mutate(deleting.id, {
      onSuccess: () => {
        message.success('Đã xoá tài liệu.')
        setDeleting(undefined)
      },
      onError: () => message.error('Không thể xoá tài liệu. Vui lòng thử lại.'),
    })
  }

  return (
    <>
      <PageHeader
        title={data.title}
        breadcrumb={breadcrumb}
        extra={
          <>
            {backButton}
            <Button type="primary" icon={<EditOutlined />} onClick={() => setEditing(true)}>
              Chỉnh sửa
            </Button>
          </>
        }
      />
      <Flex vertical gap={spacing.lg}>
        <SongInfoCard song={data} />
        <SongClassificationCard
          classification={classification.data}
          loading={classification.isPending}
          failed={classification.isError}
          onRetry={() => classification.refetch()}
          onEdit={() => setClassifying(true)}
        />
        {materials.isPending && <SectionSkeleton rows={3} label="Đang tải tài liệu" />}
        {materials.isError && (
          <Card title="Tài liệu">
            <ErrorState title="Không thể tải tài liệu" onRetry={() => materials.refetch()} retrying={materials.isFetching} />
          </Card>
        )}
        {materials.isSuccess && (
          <SongMaterialsCard
            materials={materials.data}
            uploadingKind={upload.isPending ? picked?.kind : undefined}
            onPick={handlePick}
            onDelete={setDeleting}
          />
        )}
      </Flex>

      <SongFormModal
        open={editing}
        song={data}
        saving={save.isPending}
        titleError={titleError}
        onSubmit={handleSave}
        onCancel={closeForm}
      />
      <UploadMaterialModal
        pending={picked}
        saving={upload.isPending}
        onSubmit={handleUpload}
        onCancel={() => setPicked(undefined)}
      />
      {classification.data && (
        <SongClassificationModal
          open={classifying}
          classification={classification.data}
          saving={saveClassification.isPending}
          onSubmit={handleClassify}
          onCancel={() => setClassifying(false)}
        />
      )}
      <Modal
        open={Boolean(deleting)}
        title="Xoá tài liệu này?"
        okText="Xoá"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: remove.isPending }}
        cancelButtonProps={{ disabled: remove.isPending }}
        onOk={handleDelete}
        onCancel={() => setDeleting(undefined)}
      >
        {deleting && (
          <Typography.Paragraph style={{ margin: 0 }}>
            Tài liệu <strong>{deleting.title}</strong> ({materialKindLabels[deleting.kind]}, tải lên{' '}
            {dayjs(parseUtc(deleting.createdAt)).format('DD/MM/YYYY')}) sẽ bị xoá khỏi bài hát “{data.title}”.
          </Typography.Paragraph>
        )}
      </Modal>
    </>
  )
}
