import type { ThemeConfig } from 'antd'
import { colors, layout, radius, shadows, sizes, spacing, spine, typography } from '@/styles/tokens'

/**
 * Maps Harmonia design tokens onto Ant Design theme tokens.
 * Semantic colors (success/warning/info) keep Ant Design defaults: no approved values exist yet. Two defaults fail
 * WCAG 1.4.3 as text and are darkened: the placeholder (1.8:1) and the error red (3.3:1 on white); the focus ring
 * fails 1.4.11 and uses the primary color.
 */
export const theme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorPrimaryHover: colors.primaryHover,
    colorLink: colors.primary,
    colorLinkHover: colors.primaryHover,
    colorBgLayout: colors.background,
    colorBgContainer: colors.surface,
    colorFillAlter: colors.softSurface,
    colorBorder: colors.border,
    colorBorderSecondary: 'rgba(0, 0, 0, 0.06)',
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textBody,
    colorTextTertiary: colors.textMuted,
    colorTextDisabled: colors.textDisabled,
    colorTextPlaceholder: colors.textMuted,
    colorError: '#cf1322',
    controlOutline: colors.primaryFocus,
    // Color of every keyboard focus ring; the derived default is 2.2:1 on white.
    colorPrimaryBorder: colors.primary,
    controlItemBgActive: colors.primarySoft,
    controlItemBgHover: 'rgba(142, 59, 75, 0.04)',

    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize,
    lineHeight: typography.lineHeight,
    fontSizeHeading1: typography.pageTitle.fontSize,
    lineHeightHeading1: typography.pageTitle.lineHeight,
    fontSizeHeading2: typography.sectionHeading.fontSize,
    lineHeightHeading2: typography.sectionHeading.lineHeight,
    fontSizeHeading3: typography.cardHeading.fontSize,
    lineHeightHeading3: typography.cardHeading.lineHeight,

    borderRadius: radius.md,
    borderRadiusSM: radius.sm,
    borderRadiusLG: radius.lg,
    controlHeight: sizes.controlHeight,

    boxShadow: shadows.md,
    boxShadowSecondary: shadows.lg,
    boxShadowTertiary: shadows.sm,
  },
  components: {
    Layout: {
      bodyBg: colors.background,
      headerHeight: layout.headerHeight,
      headerPadding: `0 ${layout.contentPaddingX}px`,
      siderBg: spine.background,
    },
    Menu: {
      // The light menu of the mobile drawer: the selected row is a grey step with ink text. The desktop sidebar wears
      // spineTheme below.
      itemSelectedBg: colors.selectedSurface,
      itemSelectedColor: colors.textPrimary,
      groupTitleColor: colors.textMuted,
      groupTitleFontSize: typography.metadata.fontSize,
      itemHoverBg: colors.softSurface,
      itemHoverColor: colors.textPrimary,
      itemHeight: 40,
      itemBorderRadius: radius.md,
      activeBarBorderWidth: 0,
      itemMarginInline: spacing.sm,
      itemMarginBlock: 4,
    },
    // Flat controls and cards: only what floats (menus, popovers, dialogs) casts a shadow.
    Button: {
      defaultShadow: 'none',
      primaryShadow: 'none',
      dangerShadow: 'none',
      fontWeight: 500,
    },
    Card: {
      colorBorderSecondary: 'rgba(0, 0, 0, 0.07)',
    },
    Table: {
      headerBg: colors.surface,
      headerSplitColor: 'transparent',
      rowHoverBg: colors.softSurface,
      cellPaddingBlock: spacing.md,
      borderRadius: radius.lg,
    },
    Breadcrumb: {
      fontSize: typography.metadata.fontSize,
      separatorColor: colors.textMuted,
      itemColor: colors.textMuted,
    },
    Input: {
      activeShadow: '0 0 0 3px rgba(142, 59, 75, 0.15)',
    },
    Modal: {
      boxShadow: shadows.xl,
    },
  },
}

/**
 * Ivory reading surfaces (brief §12.10): event detail and song-list review. Layout, container and elevated
 * backgrounds all take ivory, so a dropdown or modal opened inside does not flash pure white. Nested under the root
 * ConfigProvider, which still owns every other token.
 */
export const readingTheme: ThemeConfig = {
  token: {
    colorBgLayout: colors.ivory,
    colorBgContainer: colors.ivory,
    colorBgElevated: colors.ivory,
  },
}

/**
 * The desktop sidebar as the songbook's burgundy spine (owner 2026-10-31, replacing the neutral chrome of 2026-10-30;
 * no thumb tabs or area grounds). AppShell applies it around the sidebar only. The focus ring takes the pale spine
 * text: burgundy on the spine is 1.9:1.
 */
export const spineTheme: ThemeConfig = {
  components: {
    Menu: {
      itemBg: 'transparent',
      itemColor: spine.text,
      itemHoverBg: spine.hover,
      itemHoverColor: colors.surface,
      itemActiveBg: spine.selected,
      itemSelectedBg: spine.selected,
      itemSelectedColor: colors.surface,
      groupTitleColor: spine.groupTitle,
      colorPrimaryBorder: spine.text,
    },
  },
}
