import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, DatePicker, Flex, Segmented, Tabs, Typography } from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router'
import { vietnamToday } from '@/lib/api/dates'
import { useUrlTab } from '@/shared/hooks/useUrlTab'
import { PageHeader } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { DirectorAttendanceReport } from '../components/DirectorAttendanceReport'
import { DirectorPracticeReport } from '../components/DirectorPracticeReport'
import { granularityLabels, periodOf, type Granularity } from '../directorReport'

const granularities: Granularity[] = ['week', 'month', 'year']
const pickerFormats: Record<Granularity, string> = { week: '[Tuần của] DD/MM/YYYY', month: 'MM/YYYY', year: 'YYYY' }

/**
 * Choir Director: attendance (FE-45–FE-46) and practice (FE-41–FE-44) summed up by week, month or year. The backend
 * reports are Admin and Priest only, so the page totals the Director's own lists; the period sits in the address.
 */
export function DirectorReportsPage() {
  const [tab, setTab] = useUrlTab(['attendance', 'practice'], 'attendance')
  const [params, setParams] = useSearchParams()
  const granularity = granularities.find((item) => item === params.get('by')) ?? 'month'
  const dateParam = params.get('date')
  const anchor = dateParam && dayjs(dateParam).isValid() ? dayjs(dateParam) : dayjs(vietnamToday())
  const period = periodOf(granularity, anchor)

  const show = (next: { by?: Granularity; date?: dayjs.Dayjs }) => {
    const query = new URLSearchParams(params)
    query.set('by', next.by ?? granularity)
    query.set('date', (next.date ?? anchor).format('YYYY-MM-DD'))
    setParams(query, { replace: true })
  }
  const step = (direction: 1 | -1) => show({ date: anchor.add(direction, granularity) })

  return (
    <>
      <PageHeader
        title="Báo cáo ca đoàn"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Báo cáo' }]}
        description="Thống kê điểm danh và luyện tập của ca viên theo tuần, tháng hoặc năm."
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
        <Typography.Text style={{ color: colors.textMuted }}>
          Từ {dayjs(period.from).format('DD/MM/YYYY')} đến {dayjs(period.to).format('DD/MM/YYYY')}
        </Typography.Text>
      </Flex>
      <Tabs
        destroyOnHidden
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'attendance', label: 'Điểm danh', children: <DirectorAttendanceReport period={period} /> },
          { key: 'practice', label: 'Luyện tập', children: <DirectorPracticeReport period={period} /> },
        ]}
      />
    </>
  )
}
