import { Segmented } from 'antd'
import { Icon } from '@/shared/ui'
import type { ViewMode } from './viewStorage'

/** "Thẻ / Mục lục" beside "Thêm bài hát" in the page head (artifact SongLibraryPage). */
export function ViewSwitcher({ view, onChange }: Readonly<{ view: ViewMode; onChange: (view: ViewMode) => void }>) {
  return (
    <Segmented<ViewMode>
      aria-label="Kiểu xem"
      value={view}
      onChange={onChange}
      options={[
        { value: 'grid', label: 'Thẻ', icon: <Icon name="overview" /> },
        { value: 'index', label: 'Mục lục', icon: <Icon name="program" /> },
      ]}
    />
  )
}
