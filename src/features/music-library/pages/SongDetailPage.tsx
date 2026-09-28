import { ArrowLeftOutlined, EditOutlined, FileSearchOutlined } from '@ant-design/icons'
import { App, Button, Flex, Modal, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { SongClassificationCard } from '../components/SongClassificationCard'
import { SongFormModal } from '../components/SongFormModal'
import { SongMaterialsCard } from '../components/SongMaterialsCard'
import { useDeleteMaterial, useSaveSong, useSong, useSongs, useUploadMaterial } from '../hooks/useSongs'
import { distinctValues } from '../songFilters'
import { materialKindLabels, type MaterialKind, type SongMaterial, type SongValues } from '../types'

const breadcrumb = [{ title: 'Ca trưởng' }, { title: 'Kho bài hát' }, { title: 'Chi tiết bài hát' }]

/** Choir Director: one song with its FE-29 classification and FE-08/FE-28 materials. */
export function SongDetailPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { songId = '' } = useParams()
  const song = useSong(songId)
  const library = useSongs()
  const save = useSaveSong()
  const upload = useUploadMaterial(songId)
  const remove = useDeleteMaterial(songId)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState<SongMaterial>()
  const [uploadingKind, setUploadingKind] = useState<MaterialKind>()

  const suggestions = useMemo(() => {
    const all = library.data ?? []
    return {
      theme: distinctValues(all, 'theme'),
      vocalRequirements: distinctValues(all, 'vocalRequirements'),
      instrumentRequirements: distinctValues(all, 'instrumentRequirements'),
    }
  }, [library.data])

  const backButton = (
    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.director.library)}>
      Về kho bài hát
    </Button>
  )

  if (song.isPending) return <PageSkeleton sections={2} />
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
            description="Bài hát không tồn tại hoặc đường dẫn không đúng."
            action={backButton}
          />
        )}
      </>
    )
  }

  const { data } = song

  const handleSave = (values: SongValues) =>
    save.mutate(
      { id: data.id, values },
      {
        onSuccess: () => {
          message.success('Đã lưu thay đổi.')
          setEditing(false)
        },
        onError: () => message.error('Không thể lưu bài hát. Vui lòng thử lại.'),
      },
    )

  const handleUpload = (kind: MaterialKind, file: File) => {
    setUploadingKind(kind)
    upload.mutate(
      { kind, file },
      {
        onSuccess: () => message.success(`Đã tải lên ${materialKindLabels[kind].toLowerCase()}.`),
        onError: () => message.error('Không thể tải lên tài liệu. Vui lòng thử lại.'),
        onSettled: () => setUploadingKind(undefined),
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
        <SongClassificationCard song={data} />
        <SongMaterialsCard
          materials={data.materials}
          uploadingKind={uploadingKind}
          onUpload={handleUpload}
          onDelete={setDeleting}
        />
      </Flex>

      <SongFormModal
        open={editing}
        song={data}
        suggestions={suggestions}
        saving={save.isPending}
        onSubmit={handleSave}
        onCancel={() => setEditing(false)}
      />
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
            Tài liệu <strong>{deleting.fileName}</strong> ({materialKindLabels[deleting.kind]}, tải lên{' '}
            {dayjs(deleting.uploadedAt).format('DD/MM/YYYY')}) sẽ bị xoá khỏi bài hát “{data.title}”.
          </Typography.Paragraph>
        )}
      </Modal>
    </>
  )
}
