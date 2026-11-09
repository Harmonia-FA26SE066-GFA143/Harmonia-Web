import { typography } from '@/styles/tokens'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

/**
 * What ScoreViewer is willing to parse, checked before any parsing. Measured on Verovio 6.4.1 output: the largest page
 * of a 200-measure SATB score in sixteenths with three verses is 283,262 chars and 5,371 tags, the whole score 28.1 M
 * chars (100 pages). `length` stands in for bytes: Verovio's SVG is ASCII but for the lyrics.
 */
export const MAX_PAGE_CHARS = 1_000_000
export const MAX_PAGE_TAGS = 20_000
export const MAX_TOTAL_CHARS = 40_000_000

function hasTooManyTags(svg: string): boolean {
  let tags = 0
  for (let index = svg.indexOf('<'); index !== -1; index = svg.indexOf('<', index + 1)) {
    tags += 1
    if (tags > MAX_PAGE_TAGS) return true
  }
  return false
}

/**
 * `<!DOCTYPE`, `<!ENTITY` and every other `<!` declaration: a short file can expand to any size inside the parser, past
 * all the limits here. Verovio's SVG has none; comments and CDATA are not declarations and `cleanElement` removes them.
 */
const XML_DECLARATION = /<!(?!--|\[CDATA\[)/

/** True when the pages must not reach a parser at all. Also run on the output, where only the sizes can still fail. */
export function failsSvgPreflight(pages: readonly string[]): boolean {
  const total = pages.reduce((sum, page) => sum + page.length, 0)
  return total > MAX_TOTAL_CHARS || pages.some((page) => page.length > MAX_PAGE_CHARS || hasTooManyTags(page) || XML_DECLARATION.test(page))
}

/**
 * What the score may be drawn with. Built from the SVG Verovio 6.4.1 writes for sample.mxl, sample.mei and a test score
 * packed with beams, slurs, hairpins, tuplets, endings and dashed lines; `line`, `circle` and `symbol` are shapes of the
 * same kind it did not need there. Names are exact: the SVG is parsed as XML, so `SCRIPT` or `s:g` match nothing.
 */
const ALLOWED_ELEMENTS = new Set(
  'svg g defs symbol path use rect line polygon polyline ellipse circle text tspan style title desc'.split(' '),
)
const ALLOWED_ATTRIBUTES = new Set(
  `id class style type version xmlns xmlns:xlink href xlink:href
   viewBox width height overflow transform visibility x y x1 y1 x2 y2 cx cy r rx ry d points
   color fill stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray
   font-family font-size font-style font-weight text-anchor`.split(/\s+/),
)
/** Text only: `title` and `desc` are where the HTML parser leaves SVG, so an element inside one would land in HTML. */
const TEXT_ONLY_ELEMENTS = new Set(['style', 'title', 'desc'])

/** `java\tscript:`, ` JavaScript:`: browsers ignore control characters and whitespace when they read a URL scheme. */
const isScriptUrl = (value: string) => value.replace(/[\s\p{Cc}]/gu, '').toLowerCase().startsWith('javascript:')

const URL_PATTERN = /url\(\s*(['"]?)(.*?)\1\s*\)/gi
/** Anything that still loads from outside once the known forms are rewritten. */
// The lookahead also refuses a space or quote, so backtracking over `\s*['"]?` cannot slip past `url( "#id" )`.
const LEFTOVER_REFERENCE = /@import|image-set\(|url\(\s*['"]?\s*(?![\s'"#])/i

/**
 * The whole of Verovio's `@font-face` for its music text font (the ♩ of the tempo mark), the one data URL allowed: only
 * these descriptors, in this order, as one top-level block. A data URL never reaches the network.
 */
const FONT_FACE_SHAPE = String.raw`@font-face\s*\{\s*font-family:\s*'([\w -]+)';\s*src:\s*url\(data:application/font-woff2;charset=utf-8;base64,[A-Za-z0-9+/=]+\)\s*format\('woff2'\);\s*(?:font-weight:\s*normal;\s*)?(?:font-style:\s*normal;\s*)?\}`
const VEROVIO_FONT_FACE = new RegExp(String.raw`^\s*${FONT_FACE_SHAPE}$`)
const FONT_FACE_ANYWHERE = new RegExp(FONT_FACE_SHAPE, 'g')
/** What could hide a brace from `topLevelBlocks`. Verovio writes none of it outside its font blocks. */
const OPAQUE_CSS = /\/\*|\\|["']/
/** Every family Verovio 6.4.1 embedded in the scores inventoried for this list. */
const VEROVIO_FONT_FAMILIES = new Set(['Leipzig'])
/** An embedded face named like one of these would replace the app's own text everywhere. */
const UI_FONT_FAMILIES = new Set(
  `${typography.fontFamily},${typography.displayFontFamily}`.split(',').map((family) => family.trim().replace(/^'|'$/g, '').toLowerCase()),
)

// ponytail: the font bytes are not checked (a hash would tie this to one Verovio version). A forged Leipzig can only
// change the score's own ♩, since the UI never uses that family; hash it if that family ever reaches app text.
function isVerovioFontFace(block: string): boolean {
  const family = VEROVIO_FONT_FACE.exec(block)?.[1]
  return family !== undefined && VEROVIO_FONT_FAMILIES.has(family) && !UI_FONT_FAMILIES.has(family.toLowerCase())
}

/** The element ScoreViewer mounts each page in: a `<style>` inside inline SVG applies to the whole document otherwise. */
const PAGE_SELECTOR = '.hm-score-page'
const ALLOWED_CSS_PROPERTIES = new Set(
  'font-family font-weight font-style font-size fill stroke stroke-width stroke-dasharray text-anchor visibility opacity'.split(' '),
)
/** The value class has no `(`, quote, `\`, `@` or `!`, so `url()`, `expression()`, escapes and `!important` cannot match. */
const CSS_DECLARATION = /^\s*([a-z-]+)\s*:\s*([\w\s.,#%-]+?)\s*$/
/** Type, id and class selectors joined by spaces: `:`, `*`, `>`, `[` and `@` cannot match. */
const SAFE_SELECTOR = /^[a-z#.][\w#.\s-]*$/i
const DOCUMENT_ROOT_SELECTOR = /(?:^|\s)(?:html|body)(?=$|[\s.#])/i

/** Keeps the allowed properties of a declaration list (a rule's body or a `style` attribute). */
const cleanDeclarations = (css: string) =>
  css
    .split(';')
    .map((declaration) => {
      const match = CSS_DECLARATION.exec(declaration)
      return match && ALLOWED_CSS_PROPERTIES.has(match[1]) ? `${match[1]}:${match[2]};` : ''
    })
    .join('')

/** Splits CSS into its top-level `… { … }` blocks; text after the last closing brace is not a rule and is left out. */
function topLevelBlocks(css: string): string[] {
  const blocks: string[] = []
  let depth = 0
  let start = 0
  for (let index = 0; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1
    else if (css[index] === '}' && --depth <= 0) {
      blocks.push(css.slice(start, index + 1))
      start = index + 1
      depth = 0
    }
  }
  return blocks
}

/** Rebuilds one rule under the viewer page, or returns '' when a selector or the block's shape is not understood. */
function scopeRule(block: string): string {
  const rule = /^([^{}]+)\{([^{}]*)\}$/.exec(block)
  if (!rule) return ''
  const selectors = rule[1].split(',').map((selector) => selector.trim())
  if (!selectors.every((selector) => SAFE_SELECTOR.test(selector) && !DOCUMENT_ROOT_SELECTOR.test(selector))) return ''
  const declarations = cleanDeclarations(rule[2])
  return declarations && `${selectors.map((selector) => `${PAGE_SELECTOR} ${selector}`).join(', ')}{${declarations}}`
}

/**
 * Removes every external reference from a presentation attribute: `@import`, `image-set()` and `url()` other than `#id`
 * become nothing or `none`. A value with a backslash is dropped whole, since escapes can spell `url(` or `@import` in
 * disguise; Verovio writes none.
 */
function cleanCss(css: string): string {
  if (css.includes('\\')) return ''
  const cleaned = css
    .replace(/@import[^;]*;?/gi, '')
    .replace(/image-set\([^)]*\)/gi, 'none')
    .replace(URL_PATTERN, (match: string, _quote: string, target: string) => (target.trim().startsWith('#') ? match : 'none'))
  return LEFTOVER_REFERENCE.test(cleaned) ? '' : cleaned
}

/**
 * A `<style>` text: Verovio's top-level font blocks stay as written, every other block is rebuilt or dropped. A comment,
 * string or escape outside a font block loses the whole stylesheet, since the brace count cannot be trusted past one.
 */
const cleanStyleSheet = (css: string) =>
  OPAQUE_CSS.test(css.replace(FONT_FACE_ANYWHERE, ''))
    ? ''
    : topLevelBlocks(css)
        .map((block) => (isVerovioFontFace(block) ? block : scopeRule(block)))
        .join('')

const isAllowedElement = (element: Element) => element.namespaceURI === SVG_NAMESPACE && ALLOWED_ELEMENTS.has(element.tagName)

function cleanAttributes(element: Element) {
  for (const attribute of Array.from(element.attributes)) {
    const { name, value } = attribute
    let drop = !ALLOWED_ATTRIBUTES.has(name) || isScriptUrl(value) || ((name === 'href' || name === 'xlink:href') && !value.startsWith('#'))
    if (!drop && name === 'style') {
      const cleaned = cleanDeclarations(value)
      if (cleaned) attribute.value = cleaned
      else drop = true
    } else if (!drop && /url\(|\\/i.test(value)) {
      // Presentation attributes (fill, stroke) take url() too.
      drop = cleanCss(value) !== value
    }
    if (drop) element.removeAttributeNode(attribute)
  }
}

/**
 * Comments, CDATA and processing instructions go too: the XML serializer writes them back verbatim and the HTML parser
 * then reads `<?x ><img onerror=…>?>` or a CDATA block as a short comment followed by live markup.
 */
function cleanElement(element: Element) {
  const textOnly = TEXT_ONLY_ELEMENTS.has(element.tagName)
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) continue
    if (child.nodeType === Node.ELEMENT_NODE && !textOnly && isAllowedElement(child as Element)) cleanElement(child as Element)
    else child.remove()
  }
  if (element.tagName === 'style') element.textContent = cleanStyleSheet(element.textContent ?? '')
  cleanAttributes(element)
}

/**
 * Cleans one SVG page before it is mounted with `innerHTML`. The score is a file a user uploaded, so its SVG is not
 * trusted. Allow list: an element or attribute not named above is removed, an element with everything inside it. Of
 * what stays, links must be a `#fragment`, `javascript:` values go, presentation attributes lose external references
 * and CSS is rebuilt so it cannot act outside `PAGE_SELECTOR` (mount the result only inside that element). Ids, classes,
 * `use` links to its own glyphs, geometry and Verovio's styles and font are kept, so P5 can find notes by id. Returns ''
 * when the markup is not one SVG, declares a DTD, or turns out past the page limits once parsed.
 */
export function sanitizeSvg(svg: string): string {
  if (XML_DECLARATION.test(svg)) return ''
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  if (root.tagName !== 'svg' || !isAllowedElement(root) || doc.getElementsByTagName('parsererror').length > 0) return ''
  if (root.getElementsByTagName('*').length > MAX_PAGE_TAGS) return ''
  cleanElement(root)
  const clean = new XMLSerializer().serializeToString(root)
  return clean.length > MAX_PAGE_CHARS ? '' : clean
}
