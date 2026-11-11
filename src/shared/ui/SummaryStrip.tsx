import type { ReactNode } from 'react'

export interface SummaryCell {
  label: string
  /** Undefined shows "—": the count is not known. */
  value?: number
  /** A count of things waiting on the viewer: above zero the cell turns ochre and offers this action. */
  waiting?: ReactNode
}

/**
 * Counts in one sheet split into equal columns by 1px rules: a label over a serif figure, no icons (artifact
 * SummaryStrip). A waiting cell turns `area-attention` above zero and returns to plain at zero, so the colour is never
 * the only sign: the action words say it too.
 */
export function SummaryStrip({ cells, label }: Readonly<{ cells: SummaryCell[]; label: string }>) {
  return (
    <dl className="hm-summary" aria-label={label} style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
      {cells.map((cell) => {
        const waiting = cell.waiting !== undefined && (cell.value ?? 0) > 0
        return (
          <div key={cell.label} className={`hm-summary__cell${waiting ? ' is-waiting' : ''}`}>
            <dt>{cell.label}</dt>
            <dd>
              <span className="hm-summary__figure">{cell.value ?? '—'}</span>
              {waiting && <span className="hm-summary__action">{cell.waiting}</span>}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
