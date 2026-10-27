import { Card, Table, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { formatDateTime, parseUtc } from '@/lib/api/dates'
import { CardTitle, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors } from '@/styles/tokens'
import { useReportExports } from '../hooks/useReports'
import { reportDefinitions } from '../reportDefinitions'
import { reportFormatLabels, type ReportExport } from '../types'
import type { FilterOption } from './ReportFilterBar'

const pageSize = 10
const muted = { color: colors.textMuted }
const numeric = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' as const }
const day = (date: string) => dayjs(date).format('DD/MM/YYYY')

/** Files the Admins exported (`GET /api/reports/exports`), newest first; each link expires soon after loading. */
export function ExportHistory({ seasons }: Readonly<{ seasons: FilterOption[] }>) {
  const [page, setPage] = useState(1)
  const exports = useReportExports({ pageNumber: page, pageSize })
  const total = exports.data?.totalCount ?? 0

  const scope = ({ fromDate, toDate, seasonId }: ReportExport) => {
    const parts = [
      fromDate && toDate ? `${day(fromDate)} – ${day(toDate)}` : undefined,
      seasonId ? (seasons.find((season) => season.value === seasonId)?.label ?? 'Một mùa phụng vụ') : undefined,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(' · ') : <span style={muted}>Toàn bộ</span>
  }

  return (
    <Card title={<CardTitle>Lịch sử xuất báo cáo</CardTitle>} styles={{ body: { padding: total > 0 ? 0 : undefined } }}>
      {exports.isPending && <SectionSkeleton rows={3} label="Đang tải lịch sử xuất báo cáo" />}
      {exports.isError && (
        <ErrorState headingLevel={3} title="Không thể tải lịch sử xuất báo cáo" error={exports.error} hasData={exports.data !== undefined} onRetry={() => exports.refetch()} retrying={exports.isFetching} />
      )}
      {exports.data !== undefined && total === 0 && <Typography.Text style={muted}>Chưa có lần xuất báo cáo nào.</Typography.Text>}
      {exports.data !== undefined && total > 0 && (
        <Table<ReportExport>
          rowKey="id"
          dataSource={exports.data.items}
          loading={exports.isPlaceholderData}
          scroll={{ x: 'max-content' }}
          pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: setPage }}
          columns={[
            {
              key: 'at',
              title: 'Thời điểm xuất',
              render: (_, item) => <span style={numeric}>{formatDateTime(item.exportedAt)}</span>,
            },
            { key: 'kind', title: 'Loại báo cáo', render: (_, item) => (item.kind ? reportDefinitions[item.kind].label : '—') },
            { key: 'format', title: 'Định dạng', render: (_, item) => (item.format ? reportFormatLabels[item.format] : '—') },
            { key: 'scope', title: 'Phạm vi', render: (_, item) => scope(item) },
            { key: 'by', title: 'Người xuất', dataIndex: 'exportedByName' },
            {
              key: 'download',
              title: 'Tải về',
              align: 'right',
              render: (_, item) => (
                <Typography.Link
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Tải file ${item.kind ? reportDefinitions[item.kind].label : 'báo cáo'} xuất lúc ${dayjs(parseUtc(item.exportedAt)).format('HH:mm DD/MM/YYYY')}`}
                >
                  Tải file
                </Typography.Link>
              ),
            },
          ]}
        />
      )}
    </Card>
  )
}
