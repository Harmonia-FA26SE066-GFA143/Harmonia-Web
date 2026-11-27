import { Button, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { SeasonChip, SectionSkeleton } from '@/shared/ui'
import { colors, gold, spacing, typography } from '@/styles/tokens'
import { useEventNames } from '../hooks/useEventNames'
import { useProgram } from '../hooks/usePrograms'
import { massTimeLabels, massTimeOf } from '../massTime'
import type { LiturgicalEvent } from '../types'
import { EventStatusTag } from './EventStatusTag'
import { SongListStatusTag } from './SongListStatusTag'

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/** The songs of the newest list (`/api/song-lists/event/{id}/latest`), only once the event is published. */
function PreviewSongs({ eventId, onReview }: Readonly<{ eventId: string; onReview: () => void }>) {
  const program = useProgram(eventId)
  const songs = program.data?.songs ?? []
  return (
    <div>
      <Flex align="center" gap={spacing.sm} wrap>
        <p className="hm-rubric">Danh sách bài hát</p>
        {program.data?.songListStatus && <SongListStatusTag status={program.data.songListStatus} />}
      </Flex>
      {program.isPending && <SectionSkeleton rows={3} label="Đang tải danh sách bài hát" />}
      {program.isError && (
        <Flex align="center" gap={spacing.xs} wrap>
          <Typography.Text style={muted}>Không tải được danh sách bài hát.</Typography.Text>
          <Button size="small" type="link" style={{ paddingInline: 0 }} onClick={() => program.refetch()} loading={program.isFetching}>
            Thử lại
          </Button>
        </Flex>
      )}
      {program.isSuccess && songs.length === 0 && <Typography.Text style={muted}>Ca trưởng chưa gửi danh sách bài hát.</Typography.Text>}
      {songs.length > 0 && (
        <ol className="hm-preview__songs">
          {songs.map((song) => (
            <li key={song.id}>
              <span style={muted}>{song.liturgicalPart ?? 'Bài hát'}</span>
              <span>{song.title}</span>
            </li>
          ))}
        </ol>
      )}
      {program.data?.songListStatus && program.data.songListStatus !== 'draft' && (
        <Button
          type={program.data.songListStatus === 'submitted' ? 'primary' : 'default'}
          onClick={onReview}
          style={{ marginTop: spacing.sm }}
        >
          {program.data.songListStatus === 'submitted' ? 'Duyệt danh sách bài hát' : 'Xem danh sách bài hát'}
        </Button>
      )}
    </div>
  )
}

/**
 * The picked event on the reading surface beside the Priest's list (artifact PriestPrograms): its hour, name, chips,
 * place and special requirements, and for a published event the song list as Ca trưởng sent it.
 */
export function EventPreview({ event, onOpen, onReview }: Readonly<{ event: LiturgicalEvent; onOpen: () => void; onReview: () => void }>) {
  const { name, eventName } = useEventNames()
  const hour = massTimeOf(event.time)
  const title = eventName(event)
  const season = name('season', event.seasonId)
  const type = name('massType', event.massTypeId) || name('ceremonyType', event.ceremonyTypeId)

  return (
    <aside className="hm-preview hm-paper" aria-label={`Xem trước: ${title}`}>
      <Typography.Text style={{ color: gold.ink, fontSize: typography.label.fontSize, fontWeight: 600 }}>
        {[hour && massTimeLabels[hour], event.time, dayjs(event.date).format('dddd, DD/MM/YYYY')].filter(Boolean).join(' · ')}
      </Typography.Text>
      <h2 className="hm-preview__title">{title}</h2>
      <Flex wrap gap={spacing.xs} align="center">
        {season && <SeasonChip seasonName={season} size="small" />}
        {type && type !== title && <span className="hm-chip">{type}</span>}
        <EventStatusTag status={event.status} />
      </Flex>
      <Typography.Text style={muted}>{event.locationName}</Typography.Text>
      {event.specialRequirements && (
        <div>
          <p className="hm-rubric">Yêu cầu đặc biệt</p>
          <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-line' }}>{event.specialRequirements}</Typography.Paragraph>
        </div>
      )}
      {event.status === 'published' && <PreviewSongs eventId={event.id} onReview={onReview} />}
      <Flex gap={spacing.sm} wrap>
        <Button onClick={onOpen}>Mở chương trình</Button>
      </Flex>
    </aside>
  )
}
