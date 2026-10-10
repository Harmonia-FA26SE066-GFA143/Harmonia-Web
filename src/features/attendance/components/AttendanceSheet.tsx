import { CheckOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Input, Modal, Radio, Table, Typography, type TableColumnsType } from 'antd'
import { useMemo, useState } from 'react'
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
  const [draft, setDraft] = useState<Record<string, AttendanceValue | undefined>>(() =>
    Object.fromEntries(records.map((record) => [record.memberId, record.value])),
  )
  const [search, setSearch] = useState('')

  const changes = useMemo(() => {
    const changed: Record<string, AttendanceValue> = {}
    for (const record of records) {
      const value = draft[record.memberId]
      if (value && value !== record.value) changed[record.memberId] = value
    }
    return changed
  }, [draft, records])
  const changeCount = Object.keys(changes).length
  const dirty = changeCount > 0 && !save.isSuccess

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
  )
  useBeforeUnload((event) => {
    if (dirty) event.preventDefault()
  })

  const counts = useMemo(() => {
    const values = Object.values(draft)
    const marked = Object.fromEntries(
      attendanceValues.map((value) => [value, values.filter((item) => item === value).length]),
    ) as Record<AttendanceValue, number>
    return { total: records.length, ...marked, unmarked: values.filter((value) => !value).length }
  }, [draft, records.length])
  const visible = records.filter((record) => matchesSearch(search, record.fullName))

  const mark = (memberId: string, value: AttendanceValue) => setDraft((current) => ({ ...current, [memberId]: value }))
  const markAllPresent = () => setDraft(Object.fromEntries(records.map((record) => [record.memberId, 'present'])))
  const discard = () => setDraft(Object.fromEntries(records.map((record) => [record.memberId, record.value])))
  const handleSave = () =>
    save.mutate(changes, {
      onSuccess: () => message.success('Đã lưu điểm danh.'),
      onError: (error) => message.error(attendanceErrorMessage(error)),
    })

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
          value={draft[record.memberId]}
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
