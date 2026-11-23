import { Select } from 'antd'
import { formatProgramDate, type LiturgicalProgram } from '@/features/liturgical-programs'
import { SELECT_POPUP_PROPS, SummaryStrip } from '@/shared/ui'
import { participationResponseLabels, type ParticipationResponse } from '../types'

export type ResponseCounts = Record<ParticipationResponse | 'none' | 'sent', number>

// Spec order: Xác nhận, Từ chối, Chưa chắc; "Chưa phản hồi" is the waiting cell.
const answers: { key: ParticipationResponse; label: string }[] = [
  { key: 'confirmed', label: participationResponseLabels.confirmed },
  { key: 'declined', label: participationResponseLabels.declined },
  { key: 'unsure', label: 'Chưa chắc' },
]

/** The answers so far, in the page head (artifact ParticipationPage). */
export function ResponseSummary({ counts }: Readonly<{ counts: ResponseCounts }>) {
  return (
    <div className="ctb-head-strip">
      <SummaryStrip
        label={`Phản hồi trên ${counts.sent} yêu cầu đã gửi`}
        cells={[
          ...answers.map(({ key, label }) => ({ label, value: counts[key] })),
          { label: 'Chưa phản hồi', value: counts.none, waiting: 'Còn chờ' },
        ]}
      />
    </div>
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
