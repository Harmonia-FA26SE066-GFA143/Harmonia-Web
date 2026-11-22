import type { ProgramListItem } from '@/features/liturgical-programs'
import type { PagedList } from '@/lib/api/paging'

/**
 * A published program row of `listPrograms` for page tests; only the fields a test cares about need to be given.
 * The song-list due date defaults to the celebration date (a `SongList.LeadDays` of 0), not overdue.
 */
export const testProgram = (fields: Pick<ProgramListItem, 'id' | 'eventName' | 'date'> & Partial<ProgramListItem>): ProgramListItem => ({
  time: '08:00',
  locationName: 'Nhà thờ',
  status: 'published',
  songListDueDate: fields.date,
  isSongListOverdue: false,
  ...fields,
})

/** One page of `listPrograms` holding every given program. */
export const programPage = (...programs: Parameters<typeof testProgram>[0][]): PagedList<ProgramListItem> => ({
  items: programs.map(testProgram),
  pageNumber: 1,
  pageSize: 100,
  totalCount: programs.length,
  totalPages: 1,
})
