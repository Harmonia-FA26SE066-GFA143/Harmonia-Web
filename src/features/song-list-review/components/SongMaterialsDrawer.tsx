import { Drawer } from 'antd'
import { SongMaterialsCard, useSongMaterials } from '@/features/music-library'
import { ApiError } from '@/lib/api/errors'
import { EmptyState, ErrorState, SectionSkeleton } from '@/shared/ui'
import type { SongListItem } from '../types'

/**
 * Sheet music, lyrics and audio of one listed song, read-only, so the Parish Priest can judge its suitability before
 * deciding (`GET /api/music-materials?songId=`, open to every role).
 */
export function SongMaterialsDrawer({ item, onClose }: Readonly<{ item?: SongListItem; onClose: () => void }>) {
  const materials = useSongMaterials(item?.songId ?? '')
  // SONG_NOT_FOUND: the Choir Director removed the song from the library after proposing it.
  const removed = materials.error instanceof ApiError && materials.error.status === 404

  return (
    <Drawer open={Boolean(item)} title={item?.songTitle} onClose={onClose} size="large" destroyOnHidden>
      {materials.isPending && <SectionSkeleton rows={4} label="Đang tải tài liệu" />}
      {removed && (
        <EmptyState
          headingLevel={3}
          title="Bài hát không còn trong kho"
          description="Ca trưởng đã xoá bài hát này khỏi kho sau khi đề xuất, nên không còn tài liệu để xem."
        />
      )}
      {materials.isError && !removed && (
        <ErrorState
          headingLevel={3}
          title="Không thể tải tài liệu"
          error={materials.error}
          hasData={false}
          onRetry={() => materials.refetch()}
          retrying={materials.isFetching}
        />
      )}
      {materials.isSuccess && <SongMaterialsCard materials={materials.data} />}
    </Drawer>
  )
}
