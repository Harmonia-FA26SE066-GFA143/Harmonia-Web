const STAFF_DEF = /<staffDef\b[^>]*?\sn="([^"]+)"/g

/**
 * How many staves the score has, from the MEI of `ScoreEngine.load`: one per distinct `n` of Verovio's `<staffDef>`
 * (a later scoreDef, for a key or clef change, repeats them). A piano part counts its two staves.
 */
export function countStaves(mei: string): number {
  return new Set(Array.from(mei.matchAll(STAFF_DEF), (match) => match[1])).size
}
