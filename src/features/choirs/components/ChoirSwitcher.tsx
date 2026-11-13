import { Select } from 'antd'
import { useChoirs } from '../hooks/useChoirs'
import { setCurrentChoir, useCurrentChoir } from '../currentChoir'

const all = 'all'

/**
 * The choir switcher at the start of the ivory band (artifact Spine). It narrows what the backend can narrow by choir:
 * the reports, the rehearsal week, and the choir a new rehearsal or practice assignment starts with. One choir is
 * shown as its name, with nothing to pick; none, nothing at all.
 */
export function ChoirSwitcher() {
  const choirs = useChoirs()
  const current = useCurrentChoir()
  const active = (choirs.data ?? []).filter((choir) => choir.isActive)
  if (active.length === 0) return null
  if (active.length === 1) {
    return (
      <span className="hm-choir">
        <span className="hm-choir__label">Ca đoàn</span>
        <span className="hm-choir__name">{active[0].name}</span>
      </span>
    )
  }
  return (
    <label className="hm-choir">
      <span className="hm-choir__label">Ca đoàn</span>
      <Select
        size="small"
        variant="borderless"
        popupMatchSelectWidth={false}
        className="hm-choir__select"
        aria-label="Ca đoàn đang làm việc"
        value={current ?? all}
        onChange={(value: string) => setCurrentChoir(value === all ? undefined : value)}
        options={[{ value: all, label: 'Tất cả ca đoàn' }, ...active.map((choir) => ({ value: choir.id, label: choir.name }))]}
      />
    </label>
  )
}
