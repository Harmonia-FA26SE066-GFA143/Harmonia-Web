/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { spacing } from '@/styles/tokens'
import { NARROW_CONTENT_PX, PHONE_ENGINE_PAGE_WIDTH, SCORE_LAYOUT_SCALE } from '../viewer/toEnginePageWidth'

/** The stylesheets of the score area, as text: vitest does not load CSS (even `?raw` comes back empty), so the files are read. */
const SCORE_DIR = join(process.cwd(), 'src/features/rehearsals/score')
const stylesheets = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return stylesheets(path)
    return path.endsWith('.css') ? [path] : []
  })
const read = (path: string) => readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

interface Rule {
  selectors: string[]
  body: string
  reduced: boolean
  /** The `@container` condition around the rule, if any. */
  container?: string
}

/** Flat rules with the `@media (prefers-reduced-motion: reduce)` ones marked and `@container` ones carrying their condition; other at-rules are not used in these files. */
function rules(css: string): Rule[] {
  const found: Rule[] = []
  const walk = (text: string, reduced: boolean, container: string | undefined) => {
    const pattern = /([^{}]+)\{/g
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text))) {
      const head = match[1].trim()
      let depth = 1
      let end = pattern.lastIndex
      while (depth > 0 && end < text.length) {
        if (text[end] === '{') depth += 1
        if (text[end] === '}') depth -= 1
        end += 1
      }
      const inner = text.slice(pattern.lastIndex, end - 1)
      if (head.startsWith('@media')) walk(inner, reduced || /prefers-reduced-motion:\s*reduce/.test(head), container)
      else if (head.startsWith('@container')) walk(inner, reduced, head)
      else if (!head.startsWith('@keyframes')) found.push({ selectors: head.split(',').map((s) => s.trim()), body: inner, reduced, container })
      pattern.lastIndex = end
    }
  }
  walk(css, false, undefined)
  return found
}

const files = stylesheets(SCORE_DIR)

// These read the TEXT of the stylesheets: they prove the structure of the rules (who declares what), not what a browser
// lays out. vitest loads no CSS, so the behaviour (one scrolling element, computed overflow, reduced motion) is measured in
// a real browser and recorded in the P7 reports.
describe('the stylesheets of the score area (structure of the rules)', () => {
  it('finds them', () => {
    expect(files.map((f) => f.split(/[\\/]/).pop())).toEqual(expect.arrayContaining(['ScoreViewer.css', 'focusMode.css']))
  })

  it('only `.hm-score-scroll` declares overflow auto/scroll', () => {
    for (const file of files) {
      for (const rule of rules(read(file))) {
        if (/overflow(-x|-y)?\s*:\s*(auto|scroll)/.test(rule.body)) expect(rule.selectors).toEqual(['.hm-score-scroll'])
      }
    }
  })

  it('the focus layout declares clipping (hidden, inset 0), not scrolling', () => {
    const focus = rules(read(files.find((f) => f.endsWith('focusMode.css'))!))
    const root = focus.find((rule) => rule.selectors.includes('.hm-score-section--focus') && /position:\s*fixed/.test(rule.body))!
    expect(root.body).toMatch(/overflow:\s*hidden/)
    expect(root.body).toMatch(/inset:\s*0/)
  })

  it('every animated rule has a reduced-motion rule that stops it', () => {
    for (const file of files) {
      const all = rules(read(file))
      const animated = all.filter((rule) => !rule.reduced && /(^|[\s;])(animation|transition)[\w-]*\s*:/.test(rule.body))
      const stopped = all.filter((rule) => rule.reduced)
      for (const rule of animated) {
        for (const selector of rule.selectors) {
          // exact selector named in a reduced-motion rule, or a descendant of the sheet, which has a blanket rule
          const named = stopped.some((s) => s.selectors.includes(selector) && /(animation|transition)[\w-]*\s*:\s*(none|0s|0\.01ms)/.test(s.body))
          const insideSheet = selector.startsWith('.hm-score-scroll ') || selector.startsWith('.hm-score-page ')
          expect({ file: file.split(/[\\/]/).pop(), selector, covered: named || insideSheet }).toMatchObject({ covered: true })
        }
      }
      if (animated.some((rule) => rule.selectors.some((s) => s.startsWith('.hm-score-page ')))) {
        const blanket = stopped.find((s) => s.selectors.includes('.hm-score-scroll *'))
        expect(blanket?.body).toMatch(/transition:\s*none/)
      }
    }
  })

  it('the lit note and syllable transition names only paint properties', () => {
    const viewer = rules(read(files.find((f) => f.endsWith('ScoreViewer.css'))!))
    const fading = viewer.filter((rule) => !rule.reduced && /transition\s*:/.test(rule.body))
    expect(fading.length).toBeGreaterThan(0)
    for (const rule of fading) {
      const properties = rule.body.match(/transition\s*:([^;]+);/)![1]
      expect(properties).not.toMatch(/\b(all|width|height|top|left|right|bottom|margin|padding|font|transform)\b/)
      expect(properties).toMatch(/\b(fill|color|stroke)\b/)
    }
  })

  it('the sheet can scroll sideways when a page is wider than it: no overflow-x hidden on `.hm-score-scroll`', () => {
    const viewer = rules(read(files.find((f) => f.endsWith('ScoreViewer.css'))!)).filter((rule) => rule.selectors.includes('.hm-score-scroll'))
    expect(viewer.length).toBeGreaterThan(0)
    for (const rule of viewer) expect(rule.body).not.toMatch(/overflow(-x)?\s*:\s*hidden/)
    expect(viewer.some((rule) => /overflow-x\s*:\s*auto/.test(rule.body))).toBe(true)
  })

  it('a page is only let out of the sheet (max-width none) in the narrow container, at the width the page-width rule uses', () => {
    const viewer = rules(read(files.find((f) => f.endsWith('ScoreViewer.css'))!))
    const pageSvg = (rule: Rule) => rule.selectors.some((selector) => selector.includes('.hm-score-page svg'))
    const unbounded = viewer.filter((rule) => /max-width\s*:\s*none/.test(rule.body) && pageSvg(rule))
    expect(unbounded.length).toBeGreaterThan(0)
    // The viewer root is the container. It reports (its width - the sheet's padding and border) to the page-width rule,
    // rounded: 299.4 is 299 (narrow), 299.5 is 300 (not).
    const limit = NARROW_CONTENT_PX + 2 * (spacing.xl + 1) - 0.5
    for (const rule of unbounded) expect(rule.container).toContain(`width < ${limit}px`)
    // outside the narrow container the page still shrinks to the sheet
    expect(viewer.some((rule) => !rule.container && /max-width\s*:\s*100%/.test(rule.body) && pageSvg(rule))).toBe(true)
  })

  it('the phone page is shown at the desktop type size from numbers that equal the page-width rule', () => {
    const viewer = rules(read(files.find((f) => f.endsWith('ScoreViewer.css'))!))
    const root = viewer.find((rule) => rule.selectors.includes('.hm-score-viewer') && /--hm-phone-page-units/.test(rule.body))!
    expect(Number(root.body.match(/--hm-phone-page-units\s*:\s*([\d.]+)/)![1])).toBe(PHONE_ENGINE_PAGE_WIDTH)
    expect(Number(root.body.match(/--hm-layout-scale\s*:\s*([\d.]+)/)![1])).toBe(SCORE_LAYOUT_SCALE)
    const narrow = viewer.find((rule) => rule.container && rule.selectors.some((s) => s.includes('.hm-score-page svg')))!
    expect(narrow.body).toMatch(/width\s*:\s*calc\(var\(--hm-phone-page-units\)\s*\/\s*var\(--hm-layout-scale\)\s*\*\s*1px\)/)
  })
})
