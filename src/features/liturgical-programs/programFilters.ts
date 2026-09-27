import dayjs from 'dayjs'
import { matchesSearch } from '@/shared/utils/search'
import type { LiturgicalProgram, ProgramFilters } from './types'

export const emptyProgramFilters: ProgramFilters = { search: '' }

export function hasActiveProgramFilters(filters: ProgramFilters): boolean {
  return Boolean(filters.search.trim() || filters.seasonId || filters.massTypeId || filters.ceremonyTypeId)
}

/** Client-side filtering until server-side filters are defined (TBD). */
export function filterPrograms(programs: LiturgicalProgram[], filters: ProgramFilters): LiturgicalProgram[] {
  return programs.filter(
    (program) =>
      matchesSearch(filters.search, program.eventName, program.specialRequirements) &&
      (!filters.seasonId || program.season?.id === filters.seasonId) &&
      (!filters.massTypeId || program.massType?.id === filters.massTypeId) &&
      (!filters.ceremonyTypeId || program.ceremonyType?.id === filters.ceremonyTypeId),
  )
}

/** Programs celebrated today or later, earliest first. */
export function upcomingPrograms(programs: LiturgicalProgram[], today = dayjs()): LiturgicalProgram[] {
  const start = today.format('YYYY-MM-DD')
  return programs.filter((program) => program.date >= start).sort((a, b) => a.date.localeCompare(b.date))
}

export const formatProgramDate = (date: string) => dayjs(date).format('DD/MM/YYYY')
