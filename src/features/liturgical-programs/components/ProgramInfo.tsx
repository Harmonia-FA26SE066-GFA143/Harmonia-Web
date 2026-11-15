import { formatProgramDate } from '../programFilters'
import type { LiturgicalProgram } from '../types'

const orNone = (value?: string) => value || <span className="ct-facts__none">Không có</span>

/**
 * FE-16 event information of a program, for the Choir Director's proposal page: label over value, two across, on the
 * reading surface that holds it (artifact SongListProposalPage).
 */
export function ProgramInfo({ program }: Readonly<{ program: LiturgicalProgram }>) {
  const facts = [
    { label: 'Tên sự kiện', value: program.eventName, wide: true },
    { label: 'Ngày giờ cử hành', value: `${program.time} · ${formatProgramDate(program.date)}` },
    { label: 'Nơi cử hành', value: program.locationName },
    { label: 'Mùa phụng vụ', value: orNone(program.seasonName) },
    { label: 'Loại Thánh lễ', value: orNone(program.massTypeName) },
    { label: 'Loại nghi thức', value: orNone(program.ceremonyTypeName), wide: true },
    { label: 'Yêu cầu đặc biệt', value: orNone(program.specialRequirements), wide: true },
  ]
  return (
    <div>
      <h2 className="hm-rubric">Thông tin chương trình</h2>
      <dl className="ct-facts">
        {facts.map(({ label, value, wide }) => (
          <div key={label} className={wide ? 'is-wide' : undefined}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
