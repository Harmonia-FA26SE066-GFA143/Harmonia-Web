import { Select } from 'antd'
import { formatProgramDate, type LiturgicalProgram } from '@/features/liturgical-programs'
import { SELECT_POPUP_PROPS, SummaryStrip } from '@/shared/ui'
import { participationResponseLabels, type ParticipationResponse } from '../types'

export type ResponseCounts = Record<ParticipationResponse | 'none' | 'sent', number>

// Spec order: Xác nhận, Từ chối, Chưa chắc chắn; "Chưa phản hồi" is the waiting cell.
const answers: { key: ParticipationResponse; label: string }[] = [
  { key: 'confirmed', label: participationResponseLabels.confirmed },
  { key: 'declined', label: participationResponseLabels.declined },
  { key: 'unsure', label: participationResponseLabels.unsure },
]

/** The answers so far as an interactive full-width strip above the split list. */
export function ResponseSummary({
  counts,
  activeFilter,
  onSelectFilter,
}: Readonly<{
  counts: ResponseCounts
  activeFilter?: string
  onSelectFilter?: (filter: ParticipationResponse | 'none') => void
}>) {
  return (
    <SummaryStrip
      label={`Phản hồi trên ${counts.sent} yêu cầu đã gửi`}
      cells={[
        ...answers.map(({ key, label }) => ({
          label,
          value: counts[key],
          active: activeFilter === key,
          onClick: onSelectFilter ? () => onSelectFilter(key) : undefined,
        })),
        {
          label: 'Chưa phản hồi',
          value: counts.none,
          waiting: 'Còn chờ',
          active: activeFilter === 'none',
          onClick: onSelectFilter ? () => onSelectFilter('none') : undefined,
        },
      ]}
    />
  )
}

export interface ProgramPickerProps {
  program: LiturgicalProgram
  programs: LiturgicalProgram[]
  today: string
  onPick: (programId: string) => void
}

/** The Mass the requests are for, first in the filter row. */
export function ProgramPicker({ program, programs, today, onPick }: Readonly<ProgramPickerProps>) {
  return (
    <Select
      {...SELECT_POPUP_PROPS}
      aria-label="Thánh lễ"
      showSearch
      optionFilterProp="label"
      value={program.id}
      onChange={onPick}
      style={{ width: 360, maxWidth: '100%' }}
      options={programs.map((item) => ({
        value: item.id,
        label: `${item.eventName} · ${formatProgramDate(item.date)}${item.date < today ? ' (đã qua)' : ''}`,
      }))}
    />
  )
}
