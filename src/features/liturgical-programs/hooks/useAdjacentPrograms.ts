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

const windowDays = 60
const wholeWindow = { pageNumber: 1, pageSize: 100 }

const around = (date: string) => ({
  fromDate: dayjs(date).subtract(windowDays, 'day').format('YYYY-MM-DD'),
  toDate: dayjs(date).add(windowDays, 'day').format('YYYY-MM-DD'),
})

/**
 * The entries just before and after one in a list that GET /api/liturgical-events orders by date, then time
 * (LiturgicalEventRepository.SearchAsync, BE d394db4).
 */
const neighbours = <T extends { id: string }>(items: T[] | undefined, id: string) => {
  const index = items?.findIndex((item) => item.id === id) ?? -1
  return index === -1 || !items ? {} : { previous: items[index - 1], next: items[index + 1] }
}

/**
 * The programs either side of one, for moving between them from the detail header (brief §11, learnt from Planning
 * Center). Each role reads its own list: the Priest's events (drafts included), the Director's published programs.
 * ponytail: a ±60-day window of at most 100 entries; a farther neighbour is not offered.
 */
export function useAdjacentPriestEvents(id: string, date: string) {
  const events = useEvents(around(date), wholeWindow)
  const { eventName } = useEventNames()
  const { previous, next } = neighbours(events.data?.items, id)
  const toAdjacent = (event?: typeof previous): AdjacentProgram | undefined => event && { id: event.id, name: eventName(event), date: event.date }
  return { previous: toAdjacent(previous), next: toAdjacent(next) }
}

export function useAdjacentDirectorPrograms(id: string, date: string) {
  const programs = usePrograms(around(date), wholeWindow)
  const { previous, next } = neighbours(programs.data?.items, id)
  const toAdjacent = (program?: typeof previous): AdjacentProgram | undefined =>
    program && { id: program.id, name: program.eventName, date: program.date }
  return { previous: toAdjacent(previous), next: toAdjacent(next) }
}
