import { useCatalogOptions } from '@/features/system-categories'
import { useSongs } from '../hooks/useSongs'
import type { SongFilters } from '../types'

const countPage = { pageNumber: 1, pageSize: 1 }

/** Songs matching one check, as the list's own `totalCount`; nothing while it loads. */
function useCount(filters: SongFilters) {
  return useSongs(filters, countPage).data?.totalCount
}

/**
 * Quick filters beside the grid (artifact SongLibraryPage): the Mass parts in one click, with no counts since the
 * backend returns none per slot, then what the library still lacks, each counted by its own filtered query.
 */
export function LibraryRail({ value, onChange }: Readonly<{ value: SongFilters; onChange: (next: SongFilters) => void }>) {
  const slots = useCatalogOptions('liturgicalSlots')
  const checks = [
    { label: 'Chưa có bản nhạc', count: useCount({ search: '', missingMaterial: 'sheetMusic' }), active: value.missingMaterial === 'sheetMusic', next: { missingMaterial: value.missingMaterial === 'sheetMusic' ? undefined : 'sheetMusic' } },
    { label: 'Chưa có audio mẫu', count: useCount({ search: '', missingMaterial: 'sampleAudio' }), active: value.missingMaterial === 'sampleAudio', next: { missingMaterial: value.missingMaterial === 'sampleAudio' ? undefined : 'sampleAudio' } },
    { label: 'Chưa phân loại', count: useCount({ search: '', classified: 'no' }), active: value.classified === 'no', next: { classified: value.classified === 'no' ? undefined : 'no' } },
  ] satisfies { label: string; count?: number; active: boolean; next: Partial<SongFilters> }[]

  const slot = (id: string | undefined, label: string) => (
    <li key={id ?? 'all'}>
      <button type="button" className="song-rail__item" aria-pressed={value.slotId === id} onClick={() => onChange({ ...value, slotId: id })}>
        {label}
      </button>
    </li>
  )

  return (
    <nav className="song-rail" aria-label="Lọc nhanh">
      <h2 className="hm-rubric">Theo phần lễ</h2>
      <ul className="song-rail__list">
        {slot(undefined, 'Tất cả phần lễ')}
        {slots.map((option) => slot(String(option.value), String(option.label)))}
      </ul>
      <h2 className="hm-rubric" style={{ marginTop: 16 }}>Cần bổ sung</h2>
      <ul className="song-rail__list">
        {checks.map((check) => (
          <li key={check.label}>
            <button type="button" className="song-rail__item" aria-pressed={check.active} onClick={() => onChange({ ...value, ...check.next })}>
              {check.label}
              {check.count !== undefined && <span className="song-rail__count">{check.count}</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
