import { DownloadOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { App, Button, DatePicker, Dropdown, Flex, Segmented, Select, Tabs, Typography } from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router'
import { useChoirs } from '@/features/choirs'
import { vietnamToday } from '@/lib/api/dates'
import { useUrlTab } from '@/shared/hooks/useUrlTab'
import { PageHeader } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { ActivityTrendCard } from '../components/ActivityTrendCard'
import { ReportPanel } from '../components/ReportPanel'
import { granularityLabels, periodOf, type Granularity } from '../directorReport'
import { useExportReport } from '../hooks/useReports'
import { directorReportKinds, reportDefinitions } from '../reportDefinitions'
import { reportErrorMessage } from '../reportErrors'
import { saveFile } from '../saveFile'
import { reportFormatLabels, type ActivityTrendQuery, type ReportFilters, type ReportFormat } from '../types'

const granularities: Granularity[] = ['week', 'month', 'year']
const pickerFormats: Record<Granularity, string> = { week: '[Tuần của] DD/MM/YYYY', month: 'MM/YYYY', year: 'YYYY' }
const formats = Object.keys(reportFormatLabels) as ReportFormat[]

/**
 * Choir Director: the three per-member reports of the backend (attendance, participation, practice completion,
 * `/api/reports/*`, open to the Choir Director since BE 446f429) for a week, month or year, optionally narrowed to
 * one choir, with export of the open report. The period, choir and tab sit in the address. The export history stays
 * the Admin's.
 */
export function DirectorReportsPage() {
  const { message } = App.useApp()
  const [tab, setTab] = useUrlTab(directorReportKinds, 'rehearsalAttendance')
  const [params, setParams] = useSearchParams()
  const choirs = useChoirs()
  const exportReport = useExportReport()
  const granularity = granularities.find((item) => item === params.get('by')) ?? 'month'
  const dateParam = params.get('date')
  const anchor = dateParam && dayjs(dateParam).isValid() ? dayjs(dateParam) : dayjs(vietnamToday())
  const period = periodOf(granularity, anchor)
  const choirId = params.get('choirId') ?? undefined
  const filters: ReportFilters = { fromDate: period.from, toDate: period.to, choirId }
  // A year by month, a month by week; a single week is shown with the seven before it.
  const trends: Record<Granularity, { query: ActivityTrendQuery; title: string }> = {
    year: {
      query: { groupBy: 'month', fromDate: period.from, toDate: period.to, choirId },
      title: `Theo tháng trong năm ${anchor.format('YYYY')}`,
    },
    month: {
      query: { groupBy: 'week', fromDate: period.from, toDate: period.to, choirId },
      title: `Theo tuần trong tháng ${anchor.format('MM/YYYY')}`,
    },
    week: {
      query: { groupBy: 'week', fromDate: dayjs(period.from).subtract(7, 'week').format('YYYY-MM-DD'), toDate: period.to, choirId },
      title: '8 tuần gần nhất',
    },
  }
  const trend = trends[granularity]

  const show = (next: { by?: Granularity; date?: dayjs.Dayjs; choirId?: string | null }) => {
    const query = new URLSearchParams(params)
    query.set('by', next.by ?? granularity)
    query.set('date', (next.date ?? anchor).format('YYYY-MM-DD'))
    if (next.choirId === null) query.delete('choirId')
    else if (next.choirId) query.set('choirId', next.choirId)
    setParams(query, { replace: true })
  }
  const step = (direction: 1 | -1) => show({ date: anchor.add(direction, granularity) })

  const handleExport = (format: ReportFormat) => {
    if (exportReport.isPending) return
    exportReport.mutate(
      { kind: tab, format, filters },
      {
        onSuccess: (file) => {
          saveFile(file, `bao-cao-${tab}-${period.from}-${period.to}.${format}`)
          message.success('Đã xuất báo cáo.')
        },
        onError: (error) => message.error(reportErrorMessage(error, 'Không thể xuất báo cáo. Vui lòng thử lại.')),
      },
    )
  }

  return (
    <>
      <PageHeader
        title="Báo cáo ca đoàn"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Báo cáo' }]}
        description="Điểm danh, xác nhận tham gia và hoàn thành bài tập của từng ca viên theo tuần, tháng hoặc năm."
        extra={
          <Dropdown
            trigger={['click']}
            disabled={exportReport.isPending}
            menu={{
              items: formats.map((format) => ({ key: format, label: reportFormatLabels[format] })),
              onClick: ({ key }) => handleExport(key as ReportFormat),
            }}
          >
            <Button type="primary" icon={<DownloadOutlined />} loading={exportReport.isPending}>
              Xuất {reportDefinitions[tab].label.toLowerCase()}
            </Button>
          </Dropdown>
        }
      />
      <Flex wrap align="center" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
        <Segmented<Granularity>
          aria-label="Thống kê theo"
          value={granularity}
          onChange={(by) => show({ by })}
          options={granularities.map((value) => ({ value, label: granularityLabels[value] }))}
        />
        <Flex align="center" gap={spacing.xs}>
          <Button icon={<LeftOutlined />} aria-label={`${granularityLabels[granularity]} trước`} onClick={() => step(-1)} />
          <DatePicker
            picker={granularity}
            value={anchor}
            allowClear={false}
            format={pickerFormats[granularity]}
            aria-label={`Chọn ${granularityLabels[granularity].toLowerCase()}`}
            onChange={(date) => date && show({ date })}
          />
          <Button icon={<RightOutlined />} aria-label={`${granularityLabels[granularity]} sau`} onClick={() => step(1)} />
        </Flex>
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          aria-label="Ca đoàn"
          placeholder="Tất cả ca đoàn"
          loading={choirs.isPending}
          value={choirId}
          onChange={(value?: string) => show({ choirId: value ?? null })}
          options={(choirs.data ?? []).map((choir) => ({
            value: choir.id,
            label: choir.isActive ? choir.name : `${choir.name} (ngừng hoạt động)`,
          }))}
          style={{ minWidth: 220 }}
        />
        <Typography.Text style={{ color: colors.textMuted }}>
          Từ {dayjs(period.from).format('DD/MM/YYYY')} đến {dayjs(period.to).format('DD/MM/YYYY')}
        </Typography.Text>
      </Flex>
      <ActivityTrendCard query={trend.query} title={trend.title} />
      <Tabs
        destroyOnHidden
        activeKey={tab}
        onChange={setTab}
        items={directorReportKinds.map((kind) => ({
          key: kind,
          label: reportDefinitions[kind].label,
          children: (
            <ReportPanel
              key={JSON.stringify(filters)}
              kind={kind}
              filters={filters}
              filtered={Boolean(choirId)}
              onClearFilters={() => show({ choirId: null })}
            />
          ),
        }))}
      />
    </>
  )
}
