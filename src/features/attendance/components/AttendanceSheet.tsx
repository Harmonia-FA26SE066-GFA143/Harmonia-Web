import { App, Avatar, Button, Card, Flex, Input, Modal, Radio, Table, Typography, type TableColumnsType } from 'antd'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router'
import { useChoirMembers } from '@/features/members'
import { Icon, inVoicePart, NoFilterResults, SaveButton, SummaryStrip, UnassignedVoiceCell, useJustSaved, VoicePartIcon, voiceParts } from '@/shared/ui'
import { nameInitial } from '@/shared/utils/personName'
import { matchesSearch } from '@/shared/utils/search'
import { colors, media, outcomeColors, radius, shadows, spacing, spine, typography } from '@/styles/tokens'
import { attendanceErrorMessage } from '../attendanceErrors'
import { useSaveAttendance } from '../hooks/useAttendance'
import { attendanceLabels, attendanceShortLabels, attendanceValues, type AttendanceRecord, type AttendanceValue } from '../types'

const options = attendanceValues.map((value) => ({
  value,
  label: attendanceShortLabels[value],
  title: attendanceLabels[value],
  className: `attendance-mark-${value}`,
}))

/** Edits that differ from what is saved: an edit equal to the saved value is no edit. */
const withoutSaved = (edits: Record<string, AttendanceValue>, records: AttendanceRecord[]) => {
  const saved = new Map(records.map((record) => [record.memberId, record.value]))
  return Object.fromEntries(Object.entries(edits).filter(([memberId, value]) => saved.get(memberId) !== value))
}

/** The member's voice parts, from their approved skills; none when no skill names a part. */
const partsOf = (skills: readonly string[]) => voiceParts.filter(({ pattern }) => inVoicePart(skills, pattern)).map(({ label }) => label)

const initial = nameInitial

/** Marks each member's attendance; changes stay on the page until saved (leaving asks first). */
export interface AttendanceSheetProps {
  rehearsalId: string
  records: AttendanceRecord[]
  /** The session picker, first in the filter row. */
  picker: ReactNode
}

export function AttendanceSheet({ rehearsalId, records, picker }: Readonly<AttendanceSheetProps>) {
  const { message } = App.useApp()
  const save = useSaveAttendance(rehearsalId)
  // Voice parts come from approved skills: the attendance rows carry none (artifact AttendancePage asks for the part).
  const members = useChoirMembers()
  const skillsOf = useMemo(() => new Map((members.data ?? []).map((member) => [member.id, member.skills])), [members.data])
  const [justSaved, markSaved] = useJustSaved()
  // Only what the user changed; the rest reads from `records`. The sheet is not remounted when the records reload
  // (window refocus, after a save), so these edits, the search and the focus survive.
  const [edits, setEdits] = useState<Record<string, AttendanceValue>>({})
  const [search, setSearch] = useState('')
  const saveBar = useRef<HTMLDivElement>(null)

  // Reloaded records: edits they now contain are saved, whoever saved them.
  const [seenRecords, setSeenRecords] = useState(records)
  if (records !== seenRecords) {
    setSeenRecords(records)
    setEdits(withoutSaved(edits, records))
  }

  // The save bar sticks to the bottom of the window; it must not cover the control that has the keyboard focus
  // (WCAG 2.4.11), so the page scrolls focused controls clear of it.
  useEffect(() => {
    const bar = saveBar.current
    if (!bar) return
    const root = document.documentElement
    const update = () => root.style.setProperty('scroll-padding-bottom', `${bar.offsetHeight + spacing.xl}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(bar)
    return () => {
      observer.disconnect()
      root.style.removeProperty('scroll-padding-bottom')
    }
  }, [])

  const valueOf = (record: AttendanceRecord) => edits[record.memberId] ?? record.value
  const changed = records.filter((record) => record.memberId in edits)
  const dirty = changed.length > 0

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
  )
  useBeforeUnload((event) => {
    if (dirty) event.preventDefault()
  })

  const counts = useMemo(() => {
    const values = records.map((record) => edits[record.memberId] ?? record.value)
    return Object.fromEntries(attendanceValues.map((value) => [value, values.filter((item) => item === value).length])) as Record<AttendanceValue, number>
  }, [edits, records])
  const marked = attendanceValues.reduce((sum, value) => sum + counts[value], 0)
  const visible = records.filter((record) => matchesSearch(search, record.fullName))

  const mark = (memberId: string, value: AttendanceValue) =>
    setEdits((current) => withoutSaved({ ...current, [memberId]: value }, records))
  const markAllPresent = () =>
    setEdits((current) => withoutSaved({ ...current, ...Object.fromEntries(records.map((record) => [record.memberId, 'present'])) }, records))
  const discard = () => setEdits({})
  const handleSave = () => {
    if (save.isPending) return
    save.mutate(edits, {
      onSuccess: () => {
        markSaved()
        message.success('Đã lưu điểm danh.')
      },
      onError: (error) => message.error(attendanceErrorMessage(error)),
    })
  }

  const columns: TableColumnsType<AttendanceRecord> = [
    {
      key: 'name',
      title: 'Ca viên',
      render: (_, record) => (
        <Flex align="center" gap={spacing.md}>
          <Avatar aria-hidden style={{ background: colors.softSurface, color: colors.textMuted, fontWeight: 600, flexShrink: 0 }}>
            {initial(record.fullName)}
          </Avatar>
          <Flex vertical>
            <Typography.Text strong>
              {record.fullName}
              {record.memberId in edits && (
                <span
                  title="Chưa lưu"
                  style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: outcomeColors.late, marginInlineStart: spacing.sm, verticalAlign: 2 }}
                />
              )}
            </Typography.Text>
            {!valueOf(record) && <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>Chưa điểm danh</Typography.Text>}
          </Flex>
        </Flex>
      ),
    },
    {
      key: 'part',
      title: 'Bè',
      width: 160,
      render: (_, record) => {
        const parts = partsOf(skillsOf.get(record.memberId) ?? [])
        if (parts.length === 0) return <UnassignedVoiceCell />
        return (
          <Flex wrap gap={spacing.sm} style={{ fontSize: typography.label.fontSize, color: colors.textBody }}>
            {parts.map((part) => (
              <span key={part}>
                <VoicePartIcon name={part} /> {part}
              </span>
            ))}
          </Flex>
        )
      },
    },
    {
      key: 'value',
      title: 'Điểm danh',
      width: 440,
      render: (_, record) => (
        <Radio.Group
          className="attendance-marks"
          optionType="button"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}
          aria-label={`Điểm danh ${record.fullName}`}
          value={valueOf(record)}
          onChange={(event) => mark(record.memberId, event.target.value)}
          options={options}
        />
      ),
    },
  ]

  return (
    <Flex vertical gap={spacing.lg}>
      {/* Artifact AttendancePage: the session and the bulk start in one filter row, the counts, then the sheet. */}
      <Flex wrap gap={spacing.sm} align="center" className="ctb-filters">
        {picker}
        <Button icon={<Icon name="check" />} onClick={markAllPresent} disabled={save.isPending}>
          Đánh dấu tất cả có mặt
        </Button>
        <Input
          aria-label="Tìm ca viên"
          allowClear
          prefix={<Icon name="search" />}
          placeholder="Tìm ca viên…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ width: 240 }}
        />
        <span className="ctb-filters__end">
          {marked} / {records.length} đã điểm danh
        </span>
      </Flex>
      <SummaryStrip
        label={`Điểm danh: ${marked} trên ${records.length} ca viên`}
        cells={[
          ...attendanceValues.map((value) => ({ label: attendanceLabels[value], value: counts[value] })),
          { label: 'Chưa điểm danh', value: records.length - marked, waiting: 'Còn chờ' },
        ]}
      />
      <Card styles={{ body: { padding: 0 } }}>
        {visible.length === 0 ? (
          <div style={{ padding: spacing.md }}>
            <NoFilterResults onClearFilters={() => setSearch('')} />
          </div>
        ) : (
          <Table<AttendanceRecord> rowKey="memberId" columns={columns} dataSource={visible} pagination={false} scroll={{ x: 720 }} />
        )}
      </Card>
      {/* Sticky at the bottom of the window, so Save stays in reach on a long list. */}
      <Flex
        ref={saveBar}
        align="center"
        justify="space-between"
        gap={spacing.md}
        style={{
          position: 'sticky',
          bottom: spacing.md,
          zIndex: 3,
          padding: `${spacing.sm + 4}px ${spacing.md}px ${spacing.sm + 4}px ${spacing.lg}px`,
          borderRadius: radius.lg,
          background: dirty ? spine.background : colors.surface,
          border: dirty ? 'none' : `1px solid ${colors.border}`,
          boxShadow: dirty ? shadows.lg : 'none',
          color: dirty ? spine.text : colors.textMuted,
        }}
      >
        <Typography.Text aria-live="polite" ellipsis style={{ color: 'inherit', minWidth: 0 }}>
          {dirty ? (
            <>
              <b style={{ color: media.text }}>{changed.length} thay đổi chưa lưu</b> · {changed.map((record) => record.fullName).join(', ')}
            </>
          ) : (
            'Chưa có thay đổi nào.'
          )}
        </Typography.Text>
        <Flex gap={spacing.sm} style={{ flexShrink: 0 }}>
          <Button ghost={dirty} onClick={discard} disabled={!dirty || save.isPending}>
            Hủy thay đổi
          </Button>
          <SaveButton saved={justSaved && !dirty} type={dirty ? 'default' : 'primary'} onClick={handleSave} disabled={!dirty} loading={save.isPending} style={dirty ? { color: colors.primary, fontWeight: 600 } : undefined}>
            Lưu điểm danh
          </SaveButton>
        </Flex>
      </Flex>
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
    </Flex>
  )
}
