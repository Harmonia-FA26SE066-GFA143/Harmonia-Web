/**
 * Harmonia design tokens, from the Harmonia Design System artifact (owner choice 2026-11-10, replacing the "Mực son"
 * trial): Parish Burgundy for actions, the Bookcloth Spine for the chrome, Warm Paper under every page, gold only as a
 * hairline. Values and their contrast notes come from the artifact's tokens.json; contrast is measured on the ground named.
 *
 * Three layers:
 * 1. `primitive`: raw values, named by what they are. Nothing outside this file reads them.
 * 2. `semantic`: what a value is for (text.primary, action.focus). Components and CSS read this layer, in TS or as
 *    `--hm-*` variables (`cssVariables`, injected once in main.tsx).
 * 3. `component`: the few values one component owns (table head, drawer widths).
 *
 * The exports below `component` (`colors`, `spine`, `sections`…) are the compatibility layer the existing pages import;
 * each value comes from `semantic`, so no colour is written twice.
 */

// ---------------------------------------------------------------- 1. Primitive
const primitive = {
  burgundy: { 900: '#4A1D27', 850: '#5A2431', 800: '#6A2C39', 700: '#762E3D', 600: '#8E3B4B', 50: '#F6EBED' },
  rose: { 200: '#EADADD', 300: '#C9A9B0' },
  ink: { 900: '#1E1A1C', 700: '#3F3639', 500: '#615558', grey: '#575B60', 400: '#847779' },
  paper: {
    0: '#FFFFFF',
    page: '#F5F0E8',
    soft: '#F5F1F1',
    selected: '#EEE8E9',
    reading: '#F7F4ED',
    parchment: '#EEE8DC',
    line: '#E6DEDF',
    strong: '#D3C8CA',
  },
  gold: { line: '#C5A46D', soft: '#E6D7B5', ink: '#6E5119' },
  green: { 800: '#24503F', 600: '#2F6150', 50: '#E7F1EC' },
  blue: { 800: '#24405F', 600: '#2E4D72', 50: '#E8EEF6' },
  leather: { 800: '#5A3E2B', 600: '#6B4A33', 50: '#F3ECE6' },
  ochre: { 800: '#7A4F0C', 500: '#8F610E', 200: '#EBCF97', 50: '#FBF3E2' },
  slate: { 500: '#5F6E84' },
  status: {
    successInk: '#237804',
    successTint: '#F6FFED',
    warningInk: '#7A4F0C',
    warningTint: '#FFFBE6',
    errorInk: '#CF1322',
    errorTint: '#FFF1F0',
    infoInk: '#0958D9',
    infoTint: '#E6F4FF',
  },
  night: { 950: '#1C0C11' },
  season: {
    purple: { cloth: '#765A83', ink: '#5E4469' },
    green: { cloth: '#657B62', ink: '#4A5E48' },
    red: { cloth: '#A53D3D', ink: '#A53D3D' },
    rose: { cloth: '#A55570', ink: '#8A4559' },
    black: { cloth: '#3A3436', ink: '#3A3436' },
  },
} as const

const alpha = (hex: string, a: number) => {
  const n = Number.parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// ---------------------------------------------------------------- 2. Semantic
export const semantic = {
  surface: {
    /** Warm Paper: the one page ground under every workspace and the header band. */
    page: primitive.paper.page,
    /** Sheet White: cards, inputs, tables, drawers. */
    base: primitive.paper[0],
    /** Row hover, neutral chip fill. */
    soft: primitive.paper.soft,
    /** Selected row; differs from hover and stays after the pointer leaves. */
    selected: primitive.paper.selected,
    /** Ivory reading surface: program detail, song-list review, sheet music, season banner. */
    reading: primitive.paper.reading,
    /** Parchment: table header band and special metadata panels. */
    band: primitive.paper.parchment,
    /** Bookcloth Spine: the navigation, the evening program head, the landing's closing band. Nothing else. */
    chrome: primitive.burgundy[900],
    chromeHover: primitive.burgundy[850],
    chromeSelected: primitive.burgundy[800],
    media: primitive.night[950],
  },
  text: {
    /** 15.2:1 on page. */
    primary: primitive.ink[900],
    /** 10.3:1 on page. */
    body: primitive.ink[700],
    /** 6.3:1 on page, 5.0:1 on gold-soft (darkened 2026-11-12 from #6B5F62, 4.3:1 there). */
    muted: primitive.ink[500],
    /** 6.8:1 on base, 4.8:1 on gold-soft: readable, only not clickable. */
    disabled: primitive.ink.grey,
    /** On brand-primary (7.3:1), the bookcloth and season cloths. */
    onBrand: primitive.paper[0],
    /** Navigation text and the focus ring on the bookcloth (10.4:1); burgundy would be 1.9:1 there. */
    onChrome: primitive.rose[200],
    /** Group titles on the bookcloth, 12px sentence case (6.5:1). */
    onChromeMuted: primitive.rose[300],
    onMedia: primitive.paper[0],
    onMediaMuted: 'rgba(255, 255, 255, 0.88)',
  },
  border: {
    /** Decorative dividers (1.3:1). Not for control edges. */
    default: primitive.paper.line,
    /** Hover edge of a quiet surface, decorative (1.6:1). */
    strong: primitive.paper.strong,
    hairline: 'rgba(0, 0, 0, 0.07)',
    /** Control edges and the dashed draft / "Thiếu N" marks: 4.3:1 on base, 3.5:1 on parchment (WCAG 1.4.11). */
    control: primitive.ink[400],
  },
  action: {
    /** Parish Burgundy: primary button, links, focus ring, caret. White text 7.3:1. One primary action per region. */
    primary: primitive.burgundy[600],
    primaryHover: primitive.burgundy[700],
    link: primitive.burgundy[600],
    linkHover: primitive.burgundy[700],
    focus: primitive.burgundy[600],
    focusHalo: alpha(primitive.burgundy[600], 0.15),
    /** Selected filter chip or hovered link row. Never a page ground. */
    selectedWash: alpha(primitive.burgundy[600], 0.08),
  },
  status: {
    /** Always with a word or icon. */
    success: primitive.status.successInk,
    successTint: primitive.status.successTint,
    warning: primitive.status.warningInk,
    warningTint: primitive.status.warningTint,
    error: primitive.status.errorInk,
    errorTint: primitive.status.errorTint,
    info: primitive.status.infoInk,
    infoTint: primitive.status.infoTint,
  },
  /** Area cloths: only on that area's data (marks, filled steps, chips). */
  area: {
    liturgy: {
      cloth: primitive.burgundy[600],
      tint: primitive.burgundy[50],
      border: alpha(primitive.burgundy[600], 0.32),
      ink: primitive.burgundy[700],
    },
    rehearsal: {
      cloth: primitive.green[600],
      tint: primitive.green[50],
      border: alpha(primitive.green[600], 0.32),
      ink: primitive.green[800],
    },
    practice: {
      cloth: primitive.blue[600],
      tint: primitive.blue[50],
      border: alpha(primitive.blue[600], 0.3),
      ink: primitive.blue[800],
    },
    roster: {
      cloth: primitive.leather[600],
      tint: primitive.leather[50],
      border: alpha(primitive.leather[600], 0.3),
      ink: primitive.leather[800],
    },
    /** Something waiting on the viewer; leaves when the count reaches zero. */
    attention: {
      cloth: primitive.ochre[500],
      tint: primitive.ochre[50],
      border: primitive.ochre[200],
      ink: primitive.ochre[800],
    },
  },
  /** Roll-call and review charts, always beside the outcome's name. */
  outcome: {
    good: primitive.green[600],
    late: primitive.ochre[500],
    /** 5.2:1 on base, white on it 5.2:1 (darkened 2026-11-12 from #73839A, 3.9:1). */
    excused: primitive.slate[500],
    missed: primitive.burgundy[600],
  },
  brand: {
    /** The logo tile: white H on Parish Burgundy, 7.3:1. */
    mark: primitive.burgundy[600],
  },
  decor: {
    /** Gold is a hairline, never text (2.15:1 on reading), never a status. */
    gilt: primitive.gold.line,
    giltSoft: primitive.gold.soft,
    /** The only gold for text: "Lễ sáng / chiều / tối" on reading (6.6:1), 5.2:1 on giltSoft. */
    giltInk: primitive.gold.ink,
  },
  season: primitive.season,
} as const

/** Surfaces at rest are flat (one 1px border); shadow appears only on interaction or floating layers. */
export const shadows = {
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
} as const

/** Motion (artifact motion.md). Quiet at rest, alive on touch; reduced motion makes every change instant. */
export const motion = {
  instant: 100,
  fast: 150,
  base: 220,
  panel: 280,
  reveal: 480,
  entrance: 640,
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const

/**
 * Be Vietnam Pro for everything you read or operate; Cormorant Garamond for display only (hero, feast titles, season
 * name, the date numeral). Page headings stay sans. Be Vietnam Pro has no `tnum`; figures line up by layout.
 */
export const typography = {
  fontFamily:
    "'Be Vietnam Pro', Manrope, 'Source Sans 3', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  displayFontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  fontSize: 14,
  /** Generous line height for stacked Vietnamese diacritics. */
  lineHeight: 1.6,
  displayHero: { fontSize: 72, lineHeight: 0.98, fontWeight: 600 },
  displayPublic: { fontSize: 48, lineHeight: 1.08, fontWeight: 600 },
  displayCelebration: { fontSize: 36, lineHeight: 1.2, fontWeight: 600 },
  displaySeason: { fontSize: 32, lineHeight: 1.2, fontWeight: 600 },
  displayNumeral: { fontSize: 44, lineHeight: 1, fontWeight: 600 },
  pageTitle: { fontSize: 28, lineHeight: 1.3, fontWeight: 600 },
  panelTitle: { fontSize: 24, lineHeight: 1.3 },
  sectionHeading: { fontSize: 20, lineHeight: 1.4 },
  cardHeading: { fontSize: 16, lineHeight: 1.4 },
  label: { fontSize: 13 },
  metadata: { fontSize: 12 },
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

/** Chip 4, control 6, container 8, media 12. */
export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  media: 12,
} as const

export const sizes = {
  controlHeight: 40,
  /** Filters, row actions and the running-head search in dense pages; form inputs and primary buttons stay 40. */
  controlHeightCompact: 36,
  touchTarget: 44,
} as const

export const layout = {
  /** Width of the page list in the small-screen drawer. */
  sidebarWidth: 256,
  /** Running head: the bookcloth band (areas, account), then the ivory band of the area's pages. */
  headerHeight: 56,
  subnavHeight: 44,
  contentMaxWidth: 1360,
  contentPaddingX: 32,
  contentPaddingXMobile: 16,
} as const

// ---------------------------------------------------------------- 3. Component
export const component = {
  table: {
    headBg: semantic.surface.band,
    headColor: semantic.area.liturgy.ink,
    rowHover: semantic.surface.soft,
    rowSelected: semantic.surface.selected,
    /** 44px rows at 13px type; the compact density is 34px. */
    rowPaddingBlock: 11,
    rowPaddingBlockCompact: 6,
    cellPaddingInline: 12,
    fontSize: 13,
  },
  card: { border: `1px solid ${semantic.border.hairline}`, background: semantic.surface.base, headHeight: 44, padding: 16 },
  drawer: { sm: 480, md: 600, lg: 720 },
  skeleton: { from: semantic.surface.soft, to: semantic.surface.selected },
  pageHeader: { title: { fontSize: 34, lineHeight: 1.1, fontWeight: 600 } },
} as const

// ---------------------------------------------------------------- CSS variables (`--hm-*`)
const cssVars: Record<string, string> = {
  'surface-page': semantic.surface.page,
  'surface-base': semantic.surface.base,
  'surface-soft': semantic.surface.soft,
  'surface-selected': semantic.surface.selected,
  'surface-reading': semantic.surface.reading,
  'surface-band': semantic.surface.band,
  'surface-chrome': semantic.surface.chrome,
  'surface-chrome-hover': semantic.surface.chromeHover,
  'surface-chrome-selected': semantic.surface.chromeSelected,
  'surface-media': semantic.surface.media,
  'text-primary': semantic.text.primary,
  'text-body': semantic.text.body,
  'text-muted': semantic.text.muted,
  'text-disabled': semantic.text.disabled,
  'text-on-brand': semantic.text.onBrand,
  'text-on-chrome': semantic.text.onChrome,
  'text-on-chrome-muted': semantic.text.onChromeMuted,
  'text-on-media': semantic.text.onMedia,
  'text-on-media-muted': semantic.text.onMediaMuted,
  'border-default': semantic.border.default,
  'border-strong': semantic.border.strong,
  'border-hairline': semantic.border.hairline,
  'border-control': semantic.border.control,
  'action-primary': semantic.action.primary,
  'action-primary-hover': semantic.action.primaryHover,
  'action-link': semantic.action.link,
  'action-link-hover': semantic.action.linkHover,
  'action-focus': semantic.action.focus,
  'action-focus-halo': semantic.action.focusHalo,
  'action-selected-wash': semantic.action.selectedWash,
  'success': semantic.status.success,
  'success-tint': semantic.status.successTint,
  'warning': semantic.status.warning,
  'warning-tint': semantic.status.warningTint,
  'error': semantic.status.error,
  'error-tint': semantic.status.errorTint,
  'info': semantic.status.info,
  'info-tint': semantic.status.infoTint,
  'outcome-good': semantic.outcome.good,
  'outcome-late': semantic.outcome.late,
  'outcome-excused': semantic.outcome.excused,
  'outcome-missed': semantic.outcome.missed,
  'season-purple': semantic.season.purple.cloth,
  'gilt': semantic.decor.gilt,
  'gilt-soft': semantic.decor.giltSoft,
  'gilt-ink': semantic.decor.giltInk,
  'shadow-sm': shadows.sm,
  'shadow-md': shadows.md,
  'shadow-lg': shadows.lg,
  'shadow-xl': shadows.xl,
  'font-ui': typography.fontFamily,
  'font-display': typography.displayFontFamily,
  'dur-instant': `${motion.instant}ms`,
  'dur-fast': `${motion.fast}ms`,
  'dur-base': `${motion.base}ms`,
  'dur-panel': `${motion.panel}ms`,
  'dur-reveal': `${motion.reveal}ms`,
  'dur-entrance': `${motion.entrance}ms`,
  'ease-in-out': motion.easeInOut,
  'ease': motion.ease,
  'radius-sm': `${radius.sm}px`,
  'radius-md': `${radius.md}px`,
  'radius-lg': `${radius.lg}px`,
  'radius-media': `${radius.media}px`,
  'header-height': `${layout.headerHeight}px`,
  'subnav-height': `${layout.subnavHeight}px`,
  'control-compact': `${sizes.controlHeightCompact}px`,
}
for (const [key, value] of Object.entries(semantic.area)) {
  for (const [part, v] of Object.entries(value)) cssVars[`area-${key}-${part}`] = v
}

/** The `:root` block of every `--hm-*` variable; main.tsx injects it once before the first render. */
export const cssVariables = `:root{${Object.entries(cssVars)
  .map(([k, v]) => `--hm-${k}:${v}`)
  .join(';')}}`

// ---------------------------------------------------------------- Compatibility layer (existing imports)
export const colors = {
  background: semantic.surface.page,
  surface: semantic.surface.base,
  softSurface: semantic.surface.soft,
  selectedSurface: semantic.surface.selected,
  border: semantic.border.default,
  mutedBorder: semantic.border.strong,
  textPrimary: semantic.text.primary,
  textBody: semantic.text.body,
  textMuted: semantic.text.muted,
  textDisabled: semantic.text.disabled,
  /** Parish Burgundy: primary button, links, focus. */
  primary: semantic.action.primary,
  primaryHover: semantic.action.primaryHover,
  primarySoft: semantic.action.selectedWash,
  primaryFocus: semantic.action.focusHalo,
  link: semantic.action.link,
  linkHover: semantic.action.linkHover,
  focus: semantic.action.focus,
  /** The logo tile (BrandMark, favicon). */
  brand: semantic.brand.mark,
  ivory: semantic.surface.reading,
  parchment: semantic.surface.band,
  controlBorder: semantic.border.control,
  error: semantic.status.error,
} as const

/** The Bookcloth Spine: the running head, the evening program head. Text 10.4:1, group titles 6.5:1. */
export const spine = {
  background: semantic.surface.chrome,
  hover: semantic.surface.chromeHover,
  selected: semantic.surface.chromeSelected,
  text: semantic.text.onChrome,
  groupTitle: semantic.text.onChromeMuted,
} as const

/** Gilt: hairlines and feast banners. `ink` is the only gold for text. */
export const gold = {
  line: semantic.decor.gilt,
  soft: semantic.decor.giltSoft,
  ink: semantic.decor.giltInk,
} as const

/** Liturgical-season colours, only in the season banner and chip, beside the season name. */
export const seasonColors = primitive.season

export const media = {
  backdrop: semantic.surface.media,
  text: semantic.text.onMedia,
  textMuted: semantic.text.onMediaMuted,
  signInScrim: `linear-gradient(0deg, ${alpha(primitive.night[950], 0.88)} 0%, ${alpha(primitive.night[950], 0)} 48%), linear-gradient(180deg, ${alpha(primitive.night[950], 0.55)} 0%, ${alpha(primitive.night[950], 0)} 22%)`,
  heroScrim: `linear-gradient(180deg, ${alpha(primitive.night[950], 0.3)} 0%, ${alpha(primitive.night[950], 0.38)} 45%, ${alpha(primitive.night[950], 0.82)} 100%)`,
  /** The hero's window of light: clear at the crown, dark under the heading and the button. */
  windowScrim: `linear-gradient(180deg, ${alpha(primitive.night[950], 0)} 12%, ${alpha(primitive.night[950], 0.72)} 48%, ${alpha(primitive.night[950], 0.9)} 100%)`,
  imageScrim: `linear-gradient(180deg, ${alpha(primitive.night[950], 0.05)} 30%, ${alpha(primitive.night[950], 0.82)} 100%)`,
  controlBorder: 'rgba(255, 255, 255, 0.4)',
  /** Controls drawn over media (pause button ground). */
  controlGround: alpha(primitive.night[950], 0.72),
} as const

export type SectionKey = keyof typeof semantic.area

export interface SectionColors {
  cloth: string
  tint: string
  border: string
  ink: string
}

export const sections: Record<SectionKey, SectionColors> = semantic.area

export const outcomeColors = semantic.outcome

/** An event the Parish Priest made, on his calendar: a liturgy chip. */
export const priestEvent = {
  background: semantic.area.liturgy.tint,
  border: semantic.area.liturgy.border,
  text: semantic.area.liturgy.ink,
} as const

/** Card look: flat white on the paper, one hairline, no shadow. */
export const cardSurface = {
  border: component.card.border,
  boxShadow: 'none',
  background: component.card.background,
} as const
