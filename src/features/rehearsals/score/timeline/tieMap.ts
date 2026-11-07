import type { TieMap } from './types'

type TieGroup = { tieGroupId: string; isTieContinuation: boolean; members: readonly string[] }

/**
 * Reads `<tie startid endid>` from Verovio's MEI and chains A->B->C into one group. The group id is the first
 * member's id. Independent of `AliasMap`; ties missing an id are skipped.
 */
export function parseTieMap(mei: string): TieMap {
  const doc = new DOMParser().parseFromString(mei, 'application/xml')
  const next = new Map<string, string>()
  const ends = new Set<string>()

  for (const tie of Array.from(doc.getElementsByTagNameNS('*', 'tie'))) {
    const start = tie.getAttribute('startid')?.replace(/^#/, '')
    const end = tie.getAttribute('endid')?.replace(/^#/, '')
    if (!start || !end) continue
    next.set(start, end)
    ends.add(end)
  }

  const result = new Map<string, TieGroup>()
  for (const head of next.keys()) {
    if (ends.has(head)) continue
    const members = [head]
    for (let id = next.get(head); id !== undefined && !members.includes(id); id = next.get(id)) members.push(id)
    members.forEach((id, i) => result.set(id, { tieGroupId: head, isTieContinuation: i > 0, members }))
  }
  return result
}
