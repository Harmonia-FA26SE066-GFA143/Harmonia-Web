import dayjs from 'dayjs'
import { useEventNames } from './useEventNames'
import { useEvents } from './useEvents'
import { usePrograms } from './usePrograms'

/** A neighbouring program, as the "Lễ trước / Lễ sau" buttons name it. */
export interface AdjacentProgram {
  id: string
  name: string
  date: string
}

const sideDays = 14
const onePage = { pageNumber: 1, pageSize: 100 }

// Two windows that both hold the program itself: it is near the end of the one before and near the start of the one
// after, so a parish with many Masses no longer pushes it off a single page of 100 around the date.
const before = (date: string) => ({ fromDate: dayjs(date).subtract(sideDays, 'day').format('YYYY-MM-DD'), toDate: date })
const after = (date: string) => ({ fromDate: date, toDate: dayjs(date).add(sideDays, 'day').format('YYYY-MM-DD') })

/**
 * The entries just before and after one in a list that GET /api/liturgical-events orders by date, then time
 * (LiturgicalEventRepository.SearchAsync, BE d394db4).
 */
const neighbours = <T extends { id: string }>(earlier: T[] | undefined, later: T[] | undefined, id: string) => {
  const at = (items: T[] | undefined, step: number) => {
    const index = items?.findIndex((item) => item.id === id) ?? -1
    return index === -1 ? undefined : items?.[index + step]
  }
  return { previous: at(earlier, -1), next: at(later, 1) }
}

/**
 * The programs either side of one, for moving between them from the detail header (brief §11, learnt from Planning
 * Center). Each role reads its own list: the Priest's events (drafts included), the Director's published programs.
 * ponytail: 14 days each side, one page of 100 each; a farther neighbour, or more than 100 programs in the 14 days
 * before, is not offered (read the last page of the window first if a parish ever has that many).
 */
export function useAdjacentPriestEvents(id: string, date: string) {
  const earlier = useEvents(before(date), onePage)
  const later = useEvents(after(date), onePage)
  const { eventName } = useEventNames()
  const { previous, next } = neighbours(earlier.data?.items, later.data?.items, id)
  const toAdjacent = (event?: typeof previous): AdjacentProgram | undefined => event && { id: event.id, name: eventName(event), date: event.date }
  return { previous: toAdjacent(previous), next: toAdjacent(next) }
}

export function useAdjacentDirectorPrograms(id: string, date: string) {
  const earlier = usePrograms(before(date), onePage)
  const later = usePrograms(after(date), onePage)
  const { previous, next } = neighbours(earlier.data?.items, later.data?.items, id)
  const toAdjacent = (program?: typeof previous): AdjacentProgram | undefined =>
    program && { id: program.id, name: program.eventName, date: program.date }
  return { previous: toAdjacent(previous), next: toAdjacent(next) }
}
