const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

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
 * Verovio's `@font-face` for its music text font (Leipzig, the ♩ of the tempo mark), the one data URL allowed: exactly
 * this MIME, as the `src` of an `@font-face`, whose other declarations cannot hold a `(`. A data URL never reaches the
 * network. The outer group makes `split` keep the blocks it finds.
 */
const EMBEDDED_FONT =
  /(@font-face\s*\{\s*(?:[\w-]+:[\w\s'-]*;\s*)*src:\s*url\(data:application\/font-woff2;charset=utf-8;base64,[A-Za-z0-9+/=]+\)\s*format\('woff2'\);\s*(?:[\w-]+:[\w\s'-]*;\s*)*\})/i

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

/** A `<style>` text: Verovio's embedded font blocks (the odd parts of the split) stay, the rest is rebuilt rule by rule. */
const cleanStyleSheet = (css: string) =>
  css
    .split(EMBEDDED_FONT)
    .map((part, index) => (index % 2 === 1 ? part : topLevelBlocks(part).map(scopeRule).join('')))
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
 * and CSS is rebuilt so it cannot act outside `PAGE_SELECTOR` (mount the result only inside that element). Ids, classes, `use` links to its own glyphs, geometry and Verovio's styles and font are kept, so P5 can find notes by
 * id. Returns '' when the markup is not one SVG.
 */
export function sanitizeSvg(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  if (root.tagName !== 'svg' || !isAllowedElement(root) || doc.getElementsByTagName('parsererror').length > 0) return ''
  cleanElement(root)
  return new XMLSerializer().serializeToString(root)
}
