import type { ThemeConfig } from 'antd'
import { colors, layout, radius, shadows, sizes, spacing, typography } from '@/styles/tokens'

/**
 * Maps Harmonia design tokens onto Ant Design theme tokens.
 * Semantic colors (success/warning/info) keep Ant Design defaults: no approved values exist yet. Two defaults fail
 * WCAG 1.4.3 as text and are darkened: the placeholder (1.8:1) and the error red (3.3:1 on white).
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
    controlItemBgActive: colors.primarySoft,
    controlItemBgHover: 'rgba(142, 59, 75, 0.04)',

    fontFamily: typography.fontFamily,
    fontFamilyCode: typography.fontFamilyNumeric,
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
      headerBg: 'rgba(255, 255, 255, 0.85)',
      headerHeight: layout.headerHeight,
      headerPadding: `0 ${layout.contentPaddingX}px`,
      siderBg: colors.surface,
    },
    Menu: {
      itemSelectedBg: colors.primarySoft,
      itemSelectedColor: colors.primary,
      itemHoverBg: 'rgba(142, 59, 75, 0.04)',
      itemHoverColor: colors.primary,
      itemHeight: 42,
      itemBorderRadius: radius.md,
      groupTitleColor: colors.textMuted,
      groupTitleFontSize: typography.metadata.fontSize,
      activeBarBorderWidth: 0,
      itemMarginInline: spacing.sm,
      itemMarginBlock: 4,
    },
    Button: {
      primaryShadow: shadows.primary,
      defaultShadow: shadows.sm,
      dangerShadow: '0 4px 14px 0 rgba(207, 19, 34, 0.25)',
      borderRadius: radius.md,
      controlHeight: sizes.controlHeight,
      fontWeight: 500,
    },
    Card: {
      borderRadiusLG: radius.lg,
      boxShadowTertiary: shadows.sm,
      colorBorderSecondary: 'rgba(0, 0, 0, 0.07)',
    },
    Table: {
      headerBg: '#F9FAFB',
      headerColor: colors.textPrimary,
      headerSplitColor: 'transparent',
      rowHoverBg: 'rgba(142, 59, 75, 0.025)',
      cellPaddingBlock: spacing.md,
      borderRadius: radius.lg,
    },
    Breadcrumb: {
      fontSize: typography.metadata.fontSize,
      separatorColor: colors.textMuted,
      itemColor: colors.textMuted,
      lastItemColor: colors.textPrimary,
    },
    Input: {
      activeBorderColor: colors.primary,
      hoverBorderColor: colors.primaryHover,
      activeShadow: '0 0 0 3px rgba(142, 59, 75, 0.15)',
      borderRadius: radius.md,
    },
    Select: {
      borderRadius: radius.md,
      optionSelectedBg: colors.primarySoft,
    },
    Tabs: {
      itemSelectedColor: colors.primary,
      itemHoverColor: colors.primaryHover,
      inkBarColor: colors.primary,
    },
    Tag: {
      borderRadiusSM: radius.sm,
    },
    Modal: {
      borderRadiusLG: radius.lg,
      boxShadow: shadows.xl,
    },
  },
}
