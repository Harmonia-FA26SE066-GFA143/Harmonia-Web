import { Card, Flex, Typography } from 'antd'
import { CardTitle, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, sections, spacing, typography } from '@/styles/tokens'
import { useReport } from '../hooks/useReports'
import type { ReportFilters } from '../types'

const firstPage = { pageNumber: 1, pageSize: 100 }
const shownSongs = 6

/**
 * The opening of the Parish Priest's reports for the chosen month or season: the services held, in a figure and two
 * sentences (`GET /api/reports/service-history`), and the songs sung most (`GET /api/reports/song-usage`) as bars.
 */
export function ServiceLede({ filters, scope }: Readonly<{ filters: ReportFilters; scope: string }>) {
  const services = useReport('serviceHistory', filters, firstPage)
  const songs = useReport('songUsage', filters, firstPage)

  if (services.isPending || songs.isPending) return <SectionSkeleton rows={3} label="Đang tải tổng quan báo cáo" />
  const failed = services.isError ? services : songs.isError ? songs : undefined
  if (failed) {
    return <ErrorState headingLevel={2} title="Không thể tải tổng quan báo cáo" error={failed.error} onRetry={() => failed.refetch()} retrying={failed.isFetching} />
  }

  if (!services.data || !songs.data) return null
  const held = services.data.items
  const average = held.length ? Math.round(held.reduce((sum, row) => sum + Number(row.cells.membersServed ?? 0), 0) / held.length) : 0
  const used = songs.data.items
    .map((row) => ({ id: row.id, title: String(row.cells.title), composer: row.cells.composer, times: Number(row.cells.timesUsed ?? 0) }))
    .toSorted((a, b) => b.times - a.times)
  const top = used.slice(0, shownSongs)
  const most = Math.max(1, ...top.map((song) => song.times))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)', gap: spacing.md, marginBottom: spacing.lg }}>
      <Card styles={{ body: { padding: `${spacing.lg}px ${spacing.xl}px` } }}>
        <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>{scope}</Typography.Text>
        <div style={{ fontFamily: typography.displayFontFamily, fontWeight: 600, fontSize: 64, lineHeight: 1, color: colors.textPrimary, fontVariantNumeric: 'lining-nums', marginTop: spacing.xs }}>
          {services.data.totalCount}
        </div>
        <Typography.Text style={{ display: 'block', fontWeight: 500, color: colors.textPrimary }}>Thánh lễ và sự kiện đã phục vụ</Typography.Text>
        <Flex vertical gap={spacing.xs} style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTop: `1px solid ${colors.border}` }}>
          <Typography.Text style={{ color: colors.textPrimary }}>
            {held.length ? (
              <>
                Trung bình <b>{average} ca viên</b> phục vụ mỗi lễ.
              </>
            ) : (
              'Chưa có lễ nào trong khoảng này.'
            )}
          </Typography.Text>
          <Typography.Text style={{ color: colors.textPrimary }}>
            <b>{songs.data.totalCount} bài hát</b> khác nhau đã được hát.
          </Typography.Text>
        </Flex>
      </Card>
      <Card title={<CardTitle>Bài hát được hát nhiều nhất</CardTitle>}>
        {top.length === 0 ? (
          <Typography.Text style={{ color: colors.textMuted }}>Chưa có bài hát nào được dùng trong khoảng này.</Typography.Text>
        ) : (
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: spacing.sm }}>
            {top.map((song) => (
              <li key={song.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 220px) minmax(0, 1fr) 48px', gap: spacing.md, alignItems: 'center' }}>
                <Typography.Text ellipsis={{ tooltip: song.composer ? `${song.title} · ${song.composer}` : song.title }} style={{ color: colors.textPrimary, fontWeight: 500 }}>
                  {song.title}
                </Typography.Text>
                <span aria-hidden style={{ height: 10, borderRadius: 5, background: colors.softSurface, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${(song.times / most) * 100}%`, background: sections.liturgy.cloth, borderRadius: 5 }} />
                </span>
                <Typography.Text style={{ textAlign: 'end', color: colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>{song.times} lần</Typography.Text>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}
