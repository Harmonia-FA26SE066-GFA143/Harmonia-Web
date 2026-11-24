import type { CSSProperties, ReactNode } from 'react'
import { UNKNOWN_METRIC_LABEL } from './glossary'

export interface SummaryCell {
  label: string
  /** Undefined shows `unknownLabel` ("Chưa có dữ liệu" by default per R2.6), never `0`. */
  value?: number
  /** Optional cell-level override for unavailable value copy. */
  unknownLabel?: string
  /** A count of things waiting on the viewer: above zero the cell turns ochre and offers this action. */
  waiting?: ReactNode
}

/**
 * Counts in one sheet split into equal columns by 1px rules: a label over a serif figure, no icons (artifact
 * SummaryStrip). A waiting cell turns `area-attention` above zero and returns to plain at zero, so the colour is never
 * the only sign: the action words say it too. Distinguishes `0` (verified count) from `undefined` (unknown:
 * `"Chưa có dữ liệu"` per R2.6).
 */
export function SummaryStrip({
  cells,
  label,
  unknownLabel = UNKNOWN_METRIC_LABEL,
  compact,
}: Readonly<{
  cells: SummaryCell[]
  label: string
  unknownLabel?: string
  /** One quiet line of label–figure pairs instead of a ruled card: a breakdown that sits under a main strip. */
  compact?: boolean
}>) {
  return (
    // The column count goes through a variable, so global.css can fold the strip to two columns and one on narrow screens.
    <dl className={compact ? 'hm-summary hm-summary--compact' : 'hm-summary'} aria-label={label} style={{ '--hm-summary-cols': cells.length } as CSSProperties}>
      {cells.map((cell) => {
        const hasValue = cell.value !== undefined && Number.isFinite(cell.value)
        const waiting = cell.waiting !== undefined && hasValue && (cell.value as number) > 0
        const figure = hasValue ? cell.value : (cell.unknownLabel ?? unknownLabel)
        return (
          <div key={cell.label} className={`hm-summary__cell${waiting ? ' is-waiting' : ''}`}>
            <dt>{cell.label}</dt>
            <dd>
              <span className="hm-summary__figure">{figure}</span>
              {waiting && <span className="hm-summary__action">{cell.waiting}</span>}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
