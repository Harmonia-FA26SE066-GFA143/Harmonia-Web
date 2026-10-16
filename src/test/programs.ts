import type { LiturgicalProgram } from '@/features/liturgical-programs'
import type { PagedList } from '@/lib/api/paging'

/** A published program for page tests; only the fields a test cares about need to be given. */
export const testProgram = (fields: Pick<LiturgicalProgram, 'id' | 'eventName' | 'date'> & Partial<LiturgicalProgram>): LiturgicalProgram => ({
  time: '08:00',
  locationName: 'Nhà thờ',
  status: 'published',
  ...fields,
})

/** One page of `listPrograms` holding every given program. */
export const programPage = (...programs: Parameters<typeof testProgram>[0][]): PagedList<LiturgicalProgram> => ({
  items: programs.map(testProgram),
  pageNumber: 1,
  pageSize: 100,
  totalCount: programs.length,
  totalPages: 1,
})
