import { CheckOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Input, Modal, Radio, Table, Typography, type TableColumnsType } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router'
import { MetricSummary, NoFilterResults } from '@/shared/ui'
import { matchesSearch } from '@/shared/utils/search'
import { colors, layout, radius, spacing, typography } from '@/styles/tokens'
import { attendanceErrorMessage } from '../attendanceErrors'
import { useSaveAttendance } from '../hooks/useAttendance'
import { attendanceLabels, attendanceShortLabels, attendanceValues, type AttendanceRecord, type AttendanceValue } from '../types'

const metrics = [
  { key: 'total', label: 'Trong danh sách' },
  ...attendanceValues.map((value) => ({ key: value, label: attendanceLabels[value] })),
  { key: 'unmarked', label: 'Chưa điểm danh' },
]

const options = attendanceValues.map((value) => ({
  value,
  label: attendanceShortLabels[value],
  title: attendanceLabels[value],
}))

/** Edits that differ from what is saved: an edit equal to the saved value is no edit. */
const withoutSaved = (edits: Record<string, AttendanceValue>, records: AttendanceRecord[]) => {
  const saved = new Map(records.map((record) => [record.memberId, record.value]))
  return Object.fromEntries(Object.entries(edits).filter(([memberId, value]) => saved.get(memberId) !== value))
}

/** Marks each member's attendance; changes stay on the page until saved (leaving asks first). */
export interface AttendanceSheetProps {
  rehearsalId: string
  records: AttendanceRecord[]
  /** False before the session starts (REHEARSAL_NOT_STARTED): the sheet is shown read-only. */
  editable: boolean
}

export function AttendanceSheet({ rehearsalId, records, editable }: AttendanceSheetProps) {
  const { message } = App.useApp()
  const save = useSaveAttendance(rehearsalId)
  // Only what the user changed; the rest reads from `records`. The sheet is not remounted when the records reload
  // (window refocus, after a save), so these edits, the search and the focus survive.
  const [edits, setEdits] = useState<Record<string, AttendanceValue>>({})
  const [search, setSearch] = useState('')
  const toolbar = useRef<HTMLDivElement>(null)

  // Reloaded records: edits they now contain are saved, whoever saved them.
  const [seenRecords, setSeenRecords] = useState(records)
  if (records !== seenRecords) {
    setSeenRecords(records)
    setEdits(withoutSaved(edits, records))
  }

  // The sticky toolbar must not cover the control that has the keyboard focus (WCAG 2.4.11): while the sheet is shown
  // the page scrolls focused controls clear of the app header and of the toolbar below it.
  useEffect(() => {
    const bar = toolbar.current
    if (!bar) return
    const root = document.documentElement
    const update = () => root.style.setProperty('scroll-padding-top', `${layout.headerHeight + bar.offsetHeight + spacing.sm}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(bar)
    return () => {
      observer.disconnect()
      root.style.removeProperty('scroll-padding-top')
    }
  }, [])

  const valueOf = (record: AttendanceRecord) => edits[record.memberId] ?? record.value
  const changeCount = Object.keys(edits).length
  const dirty = changeCount > 0

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
  )
  useBeforeUnload((event) => {
    if (dirty) event.preventDefault()
  })

  const counts = useMemo(() => {
    const values = records.map((record) => edits[record.memberId] ?? record.value)
    const marked = Object.fromEntries(
      attendanceValues.map((value) => [value, values.filter((item) => item === value).length]),
    ) as Record<AttendanceValue, number>
    return { total: records.length, ...marked, unmarked: values.filter((value) => !value).length }
  }, [edits, records])
  const visible = records.filter((record) => matchesSearch(search, record.fullName))

  const mark = (memberId: string, value: AttendanceValue) =>
    setEdits((current) => withoutSaved({ ...current, [memberId]: value }, records))
  const markAllPresent = () =>
    setEdits((current) => withoutSaved({ ...current, ...Object.fromEntries(records.map((record) => [record.memberId, 'present'])) }, records))
  const discard = () => setEdits({})
  const handleSave = () => {
    if (save.isPending) return
    save.mutate(edits, {
      onSuccess: () => message.success('Đã lưu điểm danh.'),
      onError: (error) => message.error(attendanceErrorMessage(error)),
    })
  }

  const columns: TableColumnsType<AttendanceRecord> = [
    {
      key: 'index',
      title: 'STT',
      width: 64,
      render: (_, _record, index) => (
        <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, color: colors.textMuted }}>
          {String(index + 1).padStart(2, '0')}
        </Typography.Text>
      ),
    },
    { key: 'name', title: 'Thành viên', render: (_, record) => <Typography.Text strong>{record.fullName}</Typography.Text> },
    {
      key: 'value',
      title: 'Điểm danh',
      render: (_, record) => (
        <Radio.Group
          disabled={!editable}
          optionType="button"
          buttonStyle="solid"
          style={{ whiteSpace: 'nowrap' }}
          aria-label={`Điểm danh ${record.fullName}`}
          value={valueOf(record)}
          onChange={(event) => mark(record.memberId, event.target.value)}
          options={options}
        />
      ),
    },
  ]

  return (
    <>
      <MetricSummary definitions={metrics} values={counts} />
      <Card styles={{ body: { padding: 0 } }}>
        {/* Sticky under the app header so Save stays reachable on long lists. */}
        <Flex
          ref={toolbar}
          wrap
          gap={spacing.sm}
          align="center"
          justify="space-between"
          style={{
            padding: spacing.md,
            position: 'sticky',
            top: layout.headerHeight,
            zIndex: 3,
            background: colors.surface,
            borderRadius: `${radius.lg}px ${radius.lg}px 0 0`,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <Input
            allowClear
            prefix={<SearchOutlined aria-hidden />}
            placeholder="Tìm theo tên"
            aria-label="Tìm thành viên"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ flex: '1 1 240px', maxWidth: 380 }}
          />
          {editable && (
            <Flex wrap gap={spacing.sm}>
              <Button icon={<CheckOutlined />} onClick={markAllPresent} disabled={save.isPending}>
                Đánh dấu tất cả có mặt
              </Button>
              <Button onClick={discard} disabled={changeCount === 0 || save.isPending}>
                Hủy thay đổi
              </Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} disabled={changeCount === 0} loading={save.isPending}>
                {changeCount > 0 ? `Lưu điểm danh (${changeCount} thay đổi)` : 'Lưu điểm danh'}
              </Button>
            </Flex>
          )}
        </Flex>
        {visible.length === 0 ? (
          <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
            <NoFilterResults onClearFilters={() => setSearch('')} />
          </div>
        ) : (
          <Table<AttendanceRecord> rowKey="memberId" columns={columns} dataSource={visible} pagination={false} scroll={{ x: 640 }} />
        )}
      </Card>
      <Modal
        open={blocker.state === 'blocked'}
        title="Rời khỏi trang điểm danh?"
        okText="Rời khỏi trang"
        cancelText="Ở lại"
        okButtonProps={{ danger: true }}
        onOk={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        Các thay đổi điểm danh chưa lưu sẽ bị mất.
      </Modal>
    </>
  )
}
