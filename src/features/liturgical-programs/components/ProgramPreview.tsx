import { Button, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { SectionSkeleton } from '@/shared/ui'
import { colors, gold, spacing, typography } from '@/styles/tokens'
import { useProgram } from '../hooks/usePrograms'
import { massTimeLabels, massTimeOf } from '../massTime'
import { dueText } from '../programFilters'
import { canEditSongList, type ProgramListItem } from '../types'
import { SongListStatusTag } from './SongListStatusTag'

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/**
 * The picked program on the reading surface beside the list (artifact ProgramsPage): its hour, name, chips, special
 * requirements and the songs chosen so far by liturgical part, with the action that continues the work.
 */
export function ProgramPreview({
  program,
  today,
  onOpen,
  onPropose,
}: Readonly<{ program: ProgramListItem; today: string; onOpen: () => void; onPropose: () => void }>) {
  const detail = useProgram(program.id)
  const hour = massTimeOf(program.time)
  const due = dueText(program, today)
  const propose = canEditSongList(program.songListStatus) && program.date >= today
  const songs = detail.data?.songs ?? []
  const type = program.massTypeName ?? program.ceremonyTypeName

  return (
    <aside className="hm-preview hm-paper ct-program-preview" aria-label={`Xem trước: ${program.eventName}`}>
      <Typography.Text style={{ color: gold.ink, fontSize: typography.label.fontSize, fontWeight: 600 }}>
        {[hour && massTimeLabels[hour], program.time, dayjs(program.date).format('dddd, DD/MM/YYYY')].filter(Boolean).join(' · ')}
      </Typography.Text>
      <h2 className="hm-preview__title">{program.eventName}</h2>
      {/* One quiet line, no chips (owner 2026-11-17: the panel read as cluttered); the type only when it is not the name. */}
      <Typography.Text style={muted}>{[type !== program.eventName && type, program.seasonName, program.locationName].filter(Boolean).join(' · ')}</Typography.Text>
      {program.specialRequirements && (
        <div>
          <p className="hm-rubric">Yêu cầu đặc biệt</p>
          <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-line' }}>{program.specialRequirements}</Typography.Paragraph>
        </div>
      )}
      <div>
        <Flex align="center" justify="space-between" gap={spacing.sm}>
          <p className="hm-rubric" style={{ margin: 0 }}>Danh sách bài hát</p>
          {program.songListStatus && <SongListStatusTag status={program.songListStatus} />}
        </Flex>
        {detail.isPending && <SectionSkeleton rows={3} label="Đang tải danh sách bài hát" />}
        {detail.isError && <Typography.Text style={muted}>Không tải được danh sách bài hát.</Typography.Text>}
        {detail.data && songs.length === 0 && <Typography.Text style={muted}>Chưa chọn bài hát nào.</Typography.Text>}
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
      </div>
      {due && <Typography.Text style={{ ...muted, color: due.late ? 'var(--hm-area-attention-ink)' : colors.textMuted, fontWeight: 600 }}>{due.text}</Typography.Text>}
      <Flex gap={spacing.sm} wrap>
        {propose && (
          <Button type="primary" onClick={onPropose}>
            Tiếp tục đề xuất
          </Button>
        )}
        {program.status !== 'cancelled' && <Button onClick={onOpen}>Mở chương trình</Button>}
      </Flex>
    </aside>
  )
}
