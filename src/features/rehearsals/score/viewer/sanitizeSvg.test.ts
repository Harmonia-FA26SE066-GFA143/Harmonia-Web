import { afterEach, describe, expect, it, vi } from 'vitest'
import { failsSvgPreflight, MAX_PAGE_CHARS, MAX_PAGE_TAGS, MAX_TOTAL_CHARS, sanitizeSvg } from './sanitizeSvg'
// Page 1 of docs/local/spikes/verovio/fixtures/sample.mxl from Verovio 6.4.1 (pageWidth 1344, adjustPageHeight).
import verovioPage from './__fixtures__/verovio-sample-page.svg?raw'

const XLINK = 'http://www.w3.org/1999/xlink'
const SVG = 'http://www.w3.org/2000/svg'
// Written out here on purpose: widening the list in sanitizeSvg.ts must fail this test until someone looks at it.
const DRAWING = 'svg g defs symbol path use rect line polygon polyline ellipse circle text tspan style title desc'.split(' ')
const NS = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'

const parse = (svg: string) => new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement

afterEach(() => {
  vi.restoreAllMocks()
})

describe('failsSvgPreflight', () => {
  it('accepts a page exactly at each limit and refuses one past it', () => {
    expect(failsSvgPreflight(['x'.repeat(MAX_PAGE_CHARS)])).toBe(false)
    expect(failsSvgPreflight(['x'.repeat(MAX_PAGE_CHARS + 1)])).toBe(true)
    expect(failsSvgPreflight(['<'.repeat(MAX_PAGE_TAGS)])).toBe(false)
    expect(failsSvgPreflight(['<'.repeat(MAX_PAGE_TAGS + 1)])).toBe(true)
  })

  it('adds up the pages for the total', () => {
    const page = 'x'.repeat(MAX_PAGE_CHARS)
    const atLimit = Math.floor(MAX_TOTAL_CHARS / MAX_PAGE_CHARS)
    expect(failsSvgPreflight(Array.from({ length: atLimit }, () => page))).toBe(false)
    expect(failsSvgPreflight(Array.from({ length: atLimit + 1 }, () => page))).toBe(true)
  })

  it('accepts a real Verovio page', () => {
    expect(failsSvgPreflight([verovioPage])).toBe(false)
  })

  it('leaves comments and CDATA to the sanitizer, which removes them', () => {
    expect(failsSvgPreflight([`<svg ${NS}><!-- x --><text><![CDATA[y]]></text></svg>`])).toBe(false)
  })

  it.each([
    ["Codex's entity payload", `<!DOCTYPE svg [<!ENTITY a "${'A'.repeat(10_000)}">]><svg ${NS}><text>${'&a;'.repeat(1000)}</text></svg>`],
    ['lower case', `<!doctype svg><svg ${NS}/>`],
    ['a space after <!', `<! DOCTYPE svg><svg ${NS}/>`],
    ['after a comment', `<!-- x --><!DOCTYPE svg><svg ${NS}/>`],
    ['after a processing instruction', `<?xml version="1.0"?><!DOCTYPE svg><svg ${NS}/>`],
    ['after a BOM', `﻿<!DOCTYPE svg><svg ${NS}/>`],
    ['SYSTEM', `<!DOCTYPE svg SYSTEM "http://x/a.dtd"><svg ${NS}/>`],
    ['PUBLIC', `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://x/a.dtd"><svg ${NS}/>`],
    [
      'nested entities (billion laughs)',
      `<!DOCTYPE svg [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "${'&a;'.repeat(10)}"><!ENTITY c "${'&b;'.repeat(10)}"><!ENTITY d "${'&c;'.repeat(10)}">]><svg ${NS}><text>&d;</text></svg>`,
    ],
    ['ENTITY outside a DOCTYPE', `<svg ${NS}><!ENTITY a "b"><text/></svg>`],
  ])('refuses a DTD before any parser sees it: %s', (_name, svg) => {
    const parser = vi.spyOn(DOMParser.prototype, 'parseFromString')
    expect(failsSvgPreflight([svg])).toBe(true)
    expect(sanitizeSvg(svg)).toBe('')
    expect(parser).not.toHaveBeenCalled()
  })
})

// The DTD check above means nothing can expand any more. To reach the checks behind it, the parser is stubbed to return
// more than the short input held, which is what a parser expanding something the preflight failed to see would do.
describe('sanitizeSvg after parsing', () => {
  const realParse = DOMParser.prototype.parseFromString
  const parserExpandsTo = (svg: string) =>
    vi.spyOn(DOMParser.prototype, 'parseFromString').mockImplementation(function (this: DOMParser, _input, type) {
      return realParse.call(this, svg, type)
    })
  const short = `<svg ${NS}/>`

  it('refuses a page that parses into too many elements', () => {
    parserExpandsTo(`<svg ${NS}>${'<g/>'.repeat(MAX_PAGE_TAGS + 1)}</svg>`)
    expect(sanitizeSvg(short)).toBe('')
  })

  it('refuses a page that serializes past the size limit', () => {
    parserExpandsTo(`<svg ${NS}><text>${'x'.repeat(MAX_PAGE_CHARS)}</text></svg>`)
    expect(sanitizeSvg(short)).toBe('')
  })

  it('keeps a page within both limits', () => {
    parserExpandsTo(`<svg ${NS}><g/></svg>`)
    expect(sanitizeSvg(short)).toContain('<g')
  })
})

describe('sanitizeSvg', () => {
  it('removes script and foreignObject, in any case and at any depth', () => {
    const out = sanitizeSvg(
      `<svg ${NS}><script>alert(1)</script><g><SCRIPT>x()</SCRIPT><foreignObject><div>hi</div></foreignObject></g><rect width="1"/></svg>`,
    )
    expect(out).not.toMatch(/script/i)
    expect(out).not.toMatch(/foreignObject/i)
    expect(parse(out).querySelector('rect')).not.toBeNull()
  })

  it('removes on* event handler attributes', () => {
    const out = sanitizeSvg(`<svg ${NS} onload="a()"><g class="note" onclick="b()" OnMouseOver="c()"><path d="M0 0"/></g></svg>`)
    expect(out).not.toMatch(/on(load|click|mouseover)/i)
    expect(parse(out).querySelector('g.note path')?.getAttribute('d')).toBe('M0 0')
  })

  it('removes javascript: links in href and xlink:href, also when hidden by case or whitespace', () => {
    const out = sanitizeSvg(
      `<svg ${NS}><use href="javascript:a()"/><use xlink:href=" JavaScript:b()"/><use href="java&#x09;script:c()"/><g class="javascript:d()"/></svg>`,
    )
    expect(out).not.toMatch(/script:/i)
    expect(parse(out).querySelectorAll('use')).toHaveLength(3)
  })

  it.each([
    ['embed and iframe srcdoc (Codex B1)', '<embed src="about:blank"/><iframe srcdoc="&lt;script&gt;parent.document.title=42&lt;/script&gt;"/>'],
    ['object', '<object data="https://evil.test/a"/>'],
    ['a', '<a href="#ok"><text>x</text></a>'],
    ['image', '<image href="#ok"/>'],
    ['set writing href (Codex B2)', '<use href="#ok"><set attributeName="href" to="https://evil.test/smil.svg#p" begin="0s"/></use>'],
    ['animate writing xlink:href', '<use xlink:href="#ok"><animate attributeName="xlink:href" values="https://evil.test/a.svg#p"/></use>'],
    ['animateTransform and animateMotion', '<g><animateTransform attributeName="transform"/><animateMotion path="M0 0"/></g>'],
    ['foreignObject', '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject>'],
    ['script', '<script>parent.document.title=42</script>'],
    ['an unknown element', '<blink/>'],
    ['an element from another namespace', '<x:g xmlns:x="urn:evil"/>'],
    ['an XHTML element named like a drawing one', '<g xmlns="http://www.w3.org/1999/xhtml"/>'],
    ['a prefixed SVG element, which the HTML parser would not recognise', '<s:g xmlns:s="http://www.w3.org/2000/svg" class="prefixed"/>'],
    ['CDATA that leaves a title', '<title><![CDATA[x><img src=x onerror=alert(1)>]]></title>'],
    ['a processing instruction', '<?x ><img src=x onerror=alert(1)>?>'],
    ['a style inside a title', '<title><style><![CDATA[</style><img src=x onerror=alert(1)>]]></style></title>'],
    ['a comment', '<!-- x -->'],
  ])('mounting never yields anything outside the allow list: %s', (_name, payload) => {
    const out = sanitizeSvg(`<svg ${NS}><rect width="1"/>${payload}</svg>`)
    const mount = document.createElement('div')
    mount.innerHTML = out
    const elements = Array.from(mount.querySelectorAll('*'))
    expect(elements.filter((element) => element.namespaceURI !== SVG || !DRAWING.includes(element.localName))).toEqual([])
    expect(mount.querySelector('rect')).not.toBeNull()
    expect(out).not.toMatch(/onerror|evil\.test|srcdoc|<!--|<\?x|xhtml|prefixed/)
  })

  it('removes a dropped element together with everything inside it', () => {
    const out = parse(sanitizeSvg(`<svg ${NS}><object><g class="inside"><rect/></g></object></svg>`))
    expect(out.querySelector('.inside')).toBeNull()
    expect(out.querySelector('rect')).toBeNull()
  })

  it('removes attributes outside the allow list and keeps the geometry', () => {
    const out = parse(
      sanitizeSvg(`<svg ${NS} xmlns:e="urn:e"><rect width="1" height="2" data-x="1" e:y="2" formaction="#a" onclick="b()"/></svg>`),
    )
    const rect = out.querySelector('rect')
    expect(rect?.getAttributeNames().sort()).toEqual(['height', 'width'])
    expect(out.hasAttribute('xmlns:e')).toBe(false)
  })

  it('keeps the drawing untouched: ids, classes, internal use links and attributes', () => {
    const svg = `<svg ${NS} width="2100" height="800" viewBox="0 0 21000 8000"><defs><symbol id="E0A4"><path d="M1 2"/></symbol></defs><g id="note-abc" class="note"><use xlink:href="#E0A4" x="10" y="20"/></g><g class="verse"><text font-size="400">Lạy Chúa</text></g></svg>`
    const out = parse(sanitizeSvg(svg))
    expect(out.getAttribute('viewBox')).toBe('0 0 21000 8000')
    expect(out.querySelector('#note-abc.note use')?.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#E0A4')
    expect(out.querySelector('.verse text')?.textContent).toBe('Lạy Chúa')
    expect(out.querySelector('symbol#E0A4 path')?.getAttribute('d')).toBe('M1 2')
  })

  it('drops @import and every url() in <style> and style attributes', () => {
    const out = sanitizeSvg(
      `<svg ${NS}><style>@import url(http://x/a.css); @import "http://x/b.css"; .a { fill: url(#grad) } .b { background: url('https://x/y.png') } .c { background: image-set("http://x/z.png" 1x) }</style><rect style="fill:url(http://x/a.svg#b); stroke: url( &quot;#grad&quot; )"/></svg>`,
    )
    expect(out).not.toMatch(/@import|\/\/x\/|image-set|url\(/i)
    expect(parse(out).querySelector('rect')?.hasAttribute('style')).toBe(false)
  })

  describe('CSS stays inside the viewer', () => {
    const styleOf = (css: string) => parse(sanitizeSvg(`<svg ${NS}><style>${css}</style></svg>`)).querySelector('style')?.textContent

    /** Reads the output back with a CSS parser (cssom, through a real `<style>` in jsdom), not with sanitizeSvg's own code. */
    function rulesOf(css: string) {
      const style = document.createElement('style')
      style.textContent = css
      document.head.append(style)
      const rules = Array.from(style.sheet?.cssRules ?? []) as CSSStyleRule[]
      style.remove()
      return rules
    }

    it.each([
      'body{display:none}',
      'html, body{margin:0}',
      ':root{--x:1}',
      '*{position:fixed}',
      'g.note *{fill:red}',
      '.ant-layout{position:fixed;inset:0}',
      'g.note{position:fixed}',
      'g.note::before{content:"x"}',
      'g.note::after{fill:red}',
      'g.note:has(path){fill:red}',
      'g.note, body{fill:red}',
      'g.note > body{fill:red}',
      'body.a{fill:red}',
      '@media screen{g.note{fill:red}}',
      '@media screen{g.a{fill:red}g.b{fill:red}}',
      '@media screen{@media print{g.note{fill:red}}}',
      '@keyframes k{from{opacity:0}}',
      '@import "http://x/a.css";',
      'g.note{fill:red',
    ])('removes the whole rule: %s', (css) => {
      expect(styleOf(css)).toBe('')
    })

    it.each(['url(#x)', 'url(http://x/a)', 'expression(alert(1))', '\\72 ed', 'red!important', '"}body{display:none}'])(
      'removes a declaration whose value is %s',
      (value) => {
        expect(styleOf(`g.a{fill:${value};stroke:red}`)).not.toMatch(/fill|body|expression|url/)
      },
    )

    it('binds a Verovio rule to the viewer page and keeps it as written', () => {
      expect(styleOf('g.dir{font-style:italic}')).toBe('.hm-score-page g.dir{font-style:italic;}')
      expect(styleOf('#a g.x, #a g.y.z {font-weight:bold;}')).toBe('.hm-score-page #a g.x, .hm-score-page #a g.y.z{font-weight:bold;}')
    })

    it('keeps only the allowed properties of a rule', () => {
      const allowed = 'font-family font-weight font-style font-size fill stroke stroke-width stroke-dasharray text-anchor visibility opacity'.split(' ')
      const css = allowed.map((property) => `${property}:1`).join(';')
      expect(styleOf(`g.a{${css};position:fixed;color:red;transform:scale(9);inset:0}`)).toBe(`.hm-score-page g.a{${allowed.map((p) => `${p}:1;`).join('')}}`)
    })

    it('a mounted page affects nothing outside it, read back with a CSS parser', () => {
      const out = sanitizeSvg(
        `<svg ${NS}><style>g.note{fill:red;position:fixed}.ant-layout{fill:red}body{display:none}svg{opacity:0}</style><g class="note"/></svg>`,
      )
      const mount = document.createElement('div')
      mount.className = 'hm-score-page'
      mount.innerHTML = out
      const outside = document.createElement('div')
      outside.innerHTML = '<div class="ant-layout"></div><svg><g class="note"></g></svg>'
      document.body.append(mount, outside)

      const rules = rulesOf(mount.querySelector('style')?.textContent ?? '')
      expect(rules.map((rule) => rule.selectorText)).toEqual(['.hm-score-page g.note', '.hm-score-page .ant-layout', '.hm-score-page svg'])
      for (const rule of rules) {
        expect(outside.querySelector(rule.selectorText)).toBeNull()
        expect(document.body.matches(rule.selectorText)).toBe(false)
      }
      expect(mount.querySelector(rules[0].selectorText)).not.toBeNull()
      expect(rules[0].style.getPropertyValue('position')).toBe('')
      mount.remove()
      outside.remove()
    })

    describe('@font-face', () => {
      const SRC = "src: url(data:application/font-woff2;charset=utf-8;base64,d09GMg) format('woff2');"
      const LEIPZIG = `@font-face {\n    font-family: 'Leipzig';\n    ${SRC}\n    font-weight: normal;\n    font-style: normal;\n}`

      it.each([
        ['the UI font, with Verovio descriptors', `@font-face { font-family: 'Be Vietnam Pro'; ${SRC} font-weight: normal; font-style: normal; }`],
        ['the UI font, with weight 400', `@font-face{font-family:'Be Vietnam Pro';${SRC}font-weight:400}`],
        ['the display font', `@font-face { font-family: 'Cormorant Garamond'; ${SRC} }`],
        ['a family Verovio never embeds', `@font-face { font-family: 'Evil'; ${SRC} }`],
        ['Leipzig in another case', `@font-face { font-family: 'LEIPZIG'; ${SRC} }`],
        ['inside @media print', `@media print{${LEIPZIG}}`],
        ['inside @supports', `@supports (display:grid){${LEIPZIG}}`],
        ['unicode-range', `@font-face { font-family: 'Leipzig'; ${SRC} unicode-range: U+41; }`],
        ['font-display', `@font-face { font-family: 'Leipzig'; ${SRC} font-display: swap; }`],
        ['size-adjust', `@font-face { font-family: 'Leipzig'; size-adjust: 900%; ${SRC} }`],
        ['a weight Verovio never writes', `@font-face { font-family: 'Leipzig'; ${SRC} font-weight: bold; }`],
        ['a style Verovio never writes', `@font-face { font-family: 'Leipzig'; ${SRC} font-style: italic; }`],
      ])('drops the whole block: %s', (_name, css) => {
        expect(styleOf(css)).toBe('')
      })

      it('keeps the real Verovio block exactly as written', () => {
        expect(styleOf(LEIPZIG)).toBe(LEIPZIG)
      })

      it('judges two neighbouring blocks independently', () => {
        const bad = `@font-face { font-family: 'Be Vietnam Pro'; ${SRC} }`
        expect(styleOf(`${bad}${LEIPZIG}`)).toBe(LEIPZIG)
        expect(styleOf(`${LEIPZIG}${bad}`)).toBe(LEIPZIG)
        expect(styleOf(`${LEIPZIG}${LEIPZIG}`)).toBe(`${LEIPZIG}${LEIPZIG}`)
        expect(styleOf(`@media print{${LEIPZIG}}${LEIPZIG}`)).toBe(LEIPZIG)
      })

      const FONT = `@font-face{font-family:'Leipzig';${SRC}}`

      it.each([
        ['an unclosed comment that hides a block', `a{/*}${FONT}`],
        ['an unclosed comment at the start', `/* ${FONT}`],
        ['a closed comment around a block', `/*}${FONT}*/g.a{fill:red}`],
        ['a comment beside valid CSS', 'g.a{fill:red}/* note */'],
        ['a double-quoted string holding }', `a{content:"}${FONT}"}`],
        ['a single-quoted string holding }', `a{content:'}${FONT}'}`],
        ['a string holding /*', `a{content:"/*"}${FONT}`],
        ['a hex-escaped brace', `a{\\7d ${FONT}`],
        ['an escaped closing brace that the count would take for a real one', `a{\\}${FONT}`],
        ['a comment opener inside a font family', `@font-face{font-family:'/*';${SRC}}${FONT}`],
      ])('removes the whole stylesheet: %s', (_name, css) => {
        expect(styleOf(css)).toBe('')
      })

      it('drops a listed family as soon as the UI uses that name', async () => {
        vi.resetModules()
        vi.doMock('@/styles/tokens', () => ({ typography: { fontFamily: "leipzig, serif", displayFontFamily: 'Georgia, serif' } }))
        const { sanitizeSvg: withLeipzigInUi } = await import('./sanitizeSvg')
        vi.doUnmock('@/styles/tokens')
        vi.resetModules()
        expect(withLeipzigInUi(`<svg ${NS}><style>${LEIPZIG}</style></svg>`)).not.toContain('@font-face')
      })
    })

    it('filters a style attribute by the same properties, since an inline style can pull the SVG out of the viewer', () => {
      const out = parse(sanitizeSvg(`<svg ${NS} style="position:fixed;inset:0;fill:red"><rect style="position:fixed"/></svg>`))
      expect(out.getAttribute('style')).toBe('fill:red;')
      expect(out.querySelector('rect')?.hasAttribute('style')).toBe(false)
    })
  })

  it('drops external url() in presentation attributes such as fill and filter', () => {
    const out = parse(sanitizeSvg(`<svg ${NS}><rect fill="url(http://x/p.svg#g)" stroke="url(#f)"/></svg>`))
    expect(out.querySelector('rect')?.getAttribute('fill')).toBeNull()
    expect(out.querySelector('rect')?.getAttribute('stroke')).toBe('url(#f)')
  })

  it.each(['url(#a) red', 'url( #a )', 'url("#a")', 'URL(#a)', 'url(#a)url(#b)', 'url(#a', 'url(http://x/a#b)', 'url(#a\\)'])(
    'a presentation attribute keeps url() only as exactly url(#id): %s',
    (value) => {
      const out = parse(sanitizeSvg(`<svg ${NS}><rect fill='${value.replace(/"/g, '&quot;')}'/></svg>`))
      expect(out.querySelector('rect')?.hasAttribute('fill')).toBe(false)
    },
  )

  it('reads declarations by their first colon, with spaces around either side', () => {
    const body = (css: string) => parse(sanitizeSvg(`<svg ${NS}><style>${css}</style></svg>`)).querySelector('style')?.textContent
    expect(body('g.a{ fill : red ; stroke:blue}')).toBe('.hm-score-page g.a{fill:red;stroke:blue;}')
    expect(body('g.a{fillx;stroke:blue}')).toBe('.hm-score-page g.a{stroke:blue;}')
    expect(body('g.a{:red;stroke:blue}')).toBe('.hm-score-page g.a{stroke:blue;}')
    expect(body('g.a{fill:;stroke:blue}')).toBe('.hm-score-page g.a{stroke:blue;}')
    expect(body('g.a{fill:a:b;stroke:blue}')).toBe('.hm-score-page g.a{stroke:blue;}')
  })

  // Each input took seconds with the backtracking patterns these checks replaced, and time grew with the square of its
  // length. The limit is far above what a linear scan needs and far below what a quadratic one takes at this size.
  describe('stays fast on CSS built to make a pattern backtrack', () => {
    const SIZE = 100_000
    it.each([
      ['repeated url( in a presentation attribute', `<rect fill="${'url('.repeat(SIZE / 4)}"/>`],
      // Short on purpose: the old pattern was cubic here, and 3,000 spaces already took seconds.
      ['url( and a run of spaces in a presentation attribute', `<rect fill="url(${' '.repeat(3000)}#"/>`],
      ['a long run of spaces before a bad character in a rule', `<style>g{a:b${' '.repeat(SIZE)}(}</style>`],
      ['a long run of spaces before a bad character in a style attribute', `<rect style="a:b${' '.repeat(SIZE)}("/>`],
    ])('%s', (_name, body) => {
      const start = performance.now()
      sanitizeSvg(`<svg ${NS}>${body}</svg>`)
      expect(performance.now() - start).toBeLessThan(1000)
    })
  })

  it('drops CSS with escapes, which could spell url( or @import in disguise', () => {
    const out = sanitizeSvg(`<svg ${NS}><style>.a { background: \\75 rl(http://x) }</style><rect style="fill: \\75 rl(http://x)"/></svg>`)
    expect(out).not.toMatch(/\/\/x/)
    expect(out).not.toMatch(/\\75/)
  })

  it('drops CSS whose url( the rewrite cannot read, such as an unclosed one', () => {
    const out = sanitizeSvg(`<svg ${NS}><style>.a { fill: url(http://x/a.svg</style><rect style="fill: url(http://x/b"/></svg>`)
    expect(out).not.toMatch(/\/\/x/)
  })

  it('keeps a font embedded as a data URL (Verovio ships its music text font this way)', () => {
    const css = "@font-face { font-family: 'Leipzig'; src: url(data:application/font-woff2;charset=utf-8;base64,d09GMg) format('woff2'); }"
    expect(parse(sanitizeSvg(`<svg ${NS}><style>${css}</style></svg>`)).querySelector('style')?.textContent).toBe(css)
    expect(sanitizeSvg(`<svg ${NS}><style>.a { background: url(data:image/svg+xml;base64,PHN2Zz4=) }</style></svg>`)).not.toMatch(
      /data:image/,
    )
  })

  const WOFF2 = 'url(data:application/font-woff2;charset=utf-8;base64,d09GMg)'

  it.each([
    ['a font MIME Verovio never writes (font/svg+xml)', `@font-face { font-family: 'A'; src: url(data:font/svg+xml;base64,PHN2Zz4=) format('woff2'); }`],
    ['a made-up font MIME', `@font-face { font-family: 'A'; src: url(data:application/x-font-evil;base64,QQ==) format('woff2'); }`],
    ['the woff2 data URL on another property', `.a { background: ${WOFF2} }`],
    ['the woff2 data URL outside @font-face src', `@font-face { font-display: ${WOFF2}; }`],
    ['an external source next to the real one', `@font-face { src: url(http://x/a.woff2); src: ${WOFF2} format('woff2'); }`],
  ])('drops a data URL that is not the embedded font: %s', (_name, css) => {
    expect(sanitizeSvg(`<svg ${NS}><style>${css}</style></svg>`)).not.toMatch(/data:|\/\/x\//)
  })

  it('never keeps the woff2 data URL in an attribute', () => {
    const out = sanitizeSvg(`<svg ${NS}><rect fill="${WOFF2}" style="fill: ${WOFF2}"/></svg>`)
    expect(out).not.toMatch(/data:/)
  })

  it('href and xlink:href on any element keep only #fragments', () => {
    const out = parse(
      sanitizeSvg(
        `<svg ${NS}><use href="http://x/y.svg#a"/><use xlink:href="data:image/png;base64,AA"/><use xlink:href="#glyph"/><g href="https://example.com"/></svg>`,
      ),
    )
    const uses = out.querySelectorAll('use')
    expect(uses[0].hasAttribute('href')).toBe(false)
    expect(uses[1].hasAttributeNS(XLINK, 'href')).toBe(false)
    expect(uses[2].getAttributeNS(XLINK, 'href')).toBe('#glyph')
    expect(out.querySelector('g')?.hasAttribute('href')).toBe(false)
  })

  it('leaves a real Verovio page (sample.mxl) as it was drawn, lyrics included', () => {
    const out = sanitizeSvg(verovioPage)
    const withoutStyles = (svg: string) => svg.replace(/(<style[^>]*>)[\s\S]*?(<\/style>)/g, '$1$2')
    expect(withoutStyles(out)).toBe(withoutStyles(new XMLSerializer().serializeToString(parse(verovioPage))))
    expect(parse(out).querySelectorAll('g.note')).toHaveLength(11)

    const styles = (svg: string) => Array.from(parse(svg).getElementsByTagName('style'), (style) => style.textContent)
    const [rules, font] = styles(out)
    expect(font).toBe(styles(verovioPage)[1])
    const page = '.hm-score-page #y1d2xchf'
    // `color` on g.cursor is outside the property list; Verovio draws a cursor only for a <cursor> element, never used here.
    expect(rules).toBe(
      [
        `${page} g.ending, ${page} g.fing, ${page} g.reh, ${page} g.tempo{font-weight:bold;}`,
        `${page} g.dir, ${page} g.dynam, ${page} g.mNum{font-style:italic;}`,
        `${page} g.label{font-weight:normal;}`,
        `${page} ellipse, ${page} path, ${page} polygon, ${page} polyline, ${page} rect{stroke:currentColor;}`,
        `${page} g.cursor{fill:dodgerblue;}`,
        `${page} g.cursor.chord{fill:limegreen;}`,
        `${page} g.placeholder{visibility:hidden;}`,
      ].join(''),
    )
  })

  it('returns an empty string for markup that is not SVG or does not parse', () => {
    expect(sanitizeSvg('<svg')).toBe('')
    expect(sanitizeSvg('<html><body>x</body></html>')).toBe('')
  })
})
