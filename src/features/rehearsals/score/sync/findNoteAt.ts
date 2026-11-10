/**
 * How far from the centre of a notehead a click still means that note (client px). Measured on real scores at 1440 px
 * wide: a notehead is 17.3 x 14.6 px, so 16 px is about one head from its centre (8 px past its edge); the nearest
 * neighbour of a note is 54 px away along the staff (a crowded four-note bar) and 13.7 px away in a chord, where the
 * nearer head wins. The notes are drawn at a fixed glyph size, so the figure does not change with the page width.
 */
export const NOTE_TOLERANCE_PX = 16

/**
 * The note a click at (`x`, `y`) was aimed at, for a click that landed beside the ink: the one whose notehead centre is
 * nearest, within `tolerance`. Notes without an onset (`hasOnsets`) and notes without a notehead are not candidates. On
 * equal distance the earlier note in the document wins, so the answer is stable. Measured only when asked (a click),
 * and only over the systems within the tolerance of the point.
 */
export function findNoteAt(
  root: HTMLElement,
  x: number,
  y: number,
  hasOnsets: (id: string) => boolean,
  tolerance: number = NOTE_TOLERANCE_PX,
): Element | null {
  const systems = Array.from(root.querySelectorAll('g.system'))
  const scope = systems.length
    ? systems.filter((system) => {
        const box = system.getBoundingClientRect()
        return x >= box.left - tolerance && x <= box.right + tolerance && y >= box.top - tolerance && y <= box.bottom + tolerance
      })
    : [root]
  let best: Element | null = null
  let bestDistance = Infinity
  for (const area of scope) {
    for (const note of area.querySelectorAll('g.note')) {
      if (!note.id || !hasOnsets(note.id)) continue
      const head = note.querySelector('g.notehead')?.getBoundingClientRect()
      if (!head) continue
      const distance = Math.hypot(head.left + head.width / 2 - x, head.top + head.height / 2 - y)
      if (distance <= tolerance && distance < bestDistance) {
        best = note
        bestDistance = distance
      }
    }
  }
  return best
}
