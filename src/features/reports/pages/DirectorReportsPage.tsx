import { App, Button, DatePicker, Dropdown, Flex, Segmented, Select } from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router'
import { useChoirs } from '@/features/choirs'
import { vietnamToday } from '@/lib/api/dates'
import { useUrlTab } from '@/shared/hooks/useUrlTab'
import { CHOIR_ALL_LABEL, Icon, PageHeader, SELECT_POPUP_PROPS } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { ActivityTrendCard } from '../components/ActivityTrendCard'
import { AttendanceWatch } from '../components/AttendanceWatch'
import { ParticipationWatch } from '../components/ParticipationWatch'
import { PracticeWatch } from '../components/PracticeWatch'
import { ReportHeadlines } from '../components/ReportHeadlines'
import { ReportPanel } from '../components/ReportPanel'
import { granularityLabels, periodOf, type Granularity } from '../directorReport'
import { useExportReport } from '../hooks/useReports'
import { directorReportKinds, reportDefinitions } from '../reportDefinitions'
import { reportErrorMessage } from '../reportErrors'
import { saveFile } from '@/shared/utils/saveFile'
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
  // The page's own choir picker, kept in the URL so a shared link opens the same report.
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
    if (next.choirId) query.set('choirId', next.choirId)
    else if (next.choirId === null) query.delete('choirId')
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
        extra={
          <Dropdown
            getPopupContainer={SELECT_POPUP_PROPS.getPopupContainer}
            trigger={['click']}
            disabled={exportReport.isPending}
            menu={{
              items: formats.map((format) => ({ key: format, label: reportFormatLabels[format] })),
              onClick: ({ key }) => handleExport(key as ReportFormat),
            }}
          >
            <Button icon={<Icon name="download" />} loading={exportReport.isPending}>
              Xuất báo cáo
            </Button>
          </Dropdown>
        }
      />
      {/* Artifact ReportsPage: the report kind, the period and the cycle in one row; figures first, then the detail. */}
      <Flex vertical gap={spacing.lg}>
        <div className="ctb-filters">
          <Segmented<typeof tab>
            aria-label="Loại báo cáo"
            value={tab}
            onChange={setTab}
            options={directorReportKinds.map((kind) => ({ value: kind, label: reportDefinitions[kind].label }))}
          />
          <Flex align="center" gap={spacing.xs}>
            <Button icon={<Icon name="chevron-left" />} aria-label={`${granularityLabels[granularity]} trước`} onClick={() => step(-1)} />
            <DatePicker
              getPopupContainer={SELECT_POPUP_PROPS.getPopupContainer}
              placement="bottomLeft"
              picker={granularity}
              value={anchor}
              allowClear={false}
              format={pickerFormats[granularity]}
              aria-label="Kỳ báo cáo"
              onChange={(date) => date && show({ date })}
            />
            <Button icon={<Icon name="chevron-right" />} aria-label={`${granularityLabels[granularity]} sau`} onClick={() => step(1)} />
          </Flex>
          <Select
            {...SELECT_POPUP_PROPS}
            allowClear
            showSearch
            optionFilterProp="label"
            aria-label="Ca đoàn"
            placeholder={CHOIR_ALL_LABEL}
            loading={choirs.isPending}
            value={choirId}
            onChange={(value?: string) => show({ choirId: value ?? null })}
            options={(choirs.data ?? []).map((choir) => ({
              value: choir.id,
              label: choir.isActive ? choir.name : `${choir.name} (ngừng hoạt động)`,
            }))}
            style={{ minWidth: 200 }}
          />
          <Segmented<Granularity>
            aria-label="Chu kỳ"
            value={granularity}
            onChange={(by) => show({ by })}
            options={granularities.map((value) => ({ value, label: granularityLabels[value] }))}
          />
          <span className="ctb-filters__end">
            {dayjs(period.from).format('DD/MM')} – {dayjs(period.to).format('DD/MM/YYYY')}
          </span>
        </div>
        <ReportHeadlines kind={tab} query={{ groupBy: granularity, fromDate: period.from, toDate: period.to, choirId }} />
        {/* The middle band follows the report tab; the chart is locked to it (no toggle on this page). */}
        <div className="ctb-report-split">
          {tab === 'participation' ? (
            <ParticipationWatch filters={filters} />
          ) : (
            <>
              <ActivityTrendCard
                query={trend.query}
                title={trend.title}
                view={tab === 'assignmentCompletion' ? 'practice' : 'attendance'}
                compact
                style={{ marginBottom: 0 }}
              />
              {tab === 'assignmentCompletion' ? <PracticeWatch filters={filters} /> : <AttendanceWatch filters={filters} />}
            </>
          )}
        </div>
        <ReportPanel
          key={`${tab}:${JSON.stringify(filters)}`}
          kind={tab}
          filters={filters}
          filtered={Boolean(choirId)}
          onClearFilters={() => show({ choirId: null })}
        />
      </Flex>
    </>
  )
}
