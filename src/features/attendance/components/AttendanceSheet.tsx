import { CheckOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Input, Modal, Radio, Table, Typography, type TableColumnsType } from 'antd'
import { useMemo, useState } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router'
import { SkillTags } from '@/features/members'
import { MetricSummary, NoFilterResults } from '@/shared/ui'
import { matchesSearch } from '@/shared/utils/search'
import { colors, layout, radius, spacing, typography } from '@/styles/tokens'
import { useSaveAttendance } from '../hooks/useAttendance'
import { attendanceLabels, type AttendanceRecord, type AttendanceValue } from '../types'

const metrics = [
  { key: 'total', label: 'Trong danh sách' },
  { key: 'present', label: attendanceLabels.present },
  { key: 'absent', label: attendanceLabels.absent },
  { key: 'unmarked', label: 'Chưa điểm danh' },
]

/** Marks Present/Absent per member; changes stay on the page until saved (leaving asks first). */
export function AttendanceSheet({ rehearsalId, records }: { rehearsalId: string; records: AttendanceRecord[] }) {
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
    const present = values.filter((value) => value === 'present').length
    const absent = values.filter((value) => value === 'absent').length
    return { total: records.length, present, absent, unmarked: records.length - present - absent }
  }, [draft, records.length])
  const visible = records.filter((record) => matchesSearch(search, record.fullName, ...record.skills))

  const mark = (memberId: string, value: AttendanceValue) => setDraft((current) => ({ ...current, [memberId]: value }))
  const markAllPresent = () => setDraft(Object.fromEntries(records.map((record) => [record.memberId, 'present'])))
  const discard = () => setDraft(Object.fromEntries(records.map((record) => [record.memberId, record.value])))
  const handleSave = () =>
    save.mutate(changes, {
      onSuccess: () => message.success('Đã lưu điểm danh.'),
      onError: () => message.error('Không thể lưu điểm danh. Vui lòng thử lại.'),
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
    { key: 'skills', title: 'Kỹ năng', render: (_, record) => <SkillTags skills={record.skills} /> },
    {
      key: 'value',
      title: 'Điểm danh',
      render: (_, record) => (
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          aria-label={`Điểm danh ${record.fullName}`}
          value={draft[record.memberId]}
          onChange={(event) => mark(record.memberId, event.target.value)}
          options={[
            { value: 'present', label: attendanceLabels.present },
            { value: 'absent', label: attendanceLabels.absent },
          ]}
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
            placeholder="Tìm theo tên hoặc kỹ năng"
            aria-label="Tìm thành viên"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ flex: '1 1 240px', maxWidth: 380 }}
          />
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
