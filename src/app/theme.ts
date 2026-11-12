import type { ThemeConfig } from 'antd'
import { component, layout, motion, radius, semantic, shadows, sizes, spacing, typography } from '@/styles/tokens'

const seconds = (ms: number) => `${ms / 1000}s`

/**
 * Ant Design on the Harmonia Design System tokens (owner 2026-11-10). Parish Burgundy is primary, link and the keyboard
 * focus ring (the derived default ring is too faint for WCAG 1.4.11). Success, warning, error and info keep their own
 * tinted pairs (5.1:1 or better), always with a word or icon.
 */
export const theme: ThemeConfig = {
  token: {
    colorPrimary: semantic.action.primary,
    colorPrimaryHover: semantic.action.primaryHover,
    colorPrimaryActive: semantic.action.primaryHover,
    colorLink: semantic.action.link,
    colorLinkHover: semantic.action.linkHover,
    colorLinkActive: semantic.action.linkHover,
    colorBgLayout: semantic.surface.page,
    colorBgContainer: semantic.surface.base,
    colorFillAlter: semantic.surface.soft,
    colorBorder: semantic.border.control,
    colorBorderSecondary: semantic.border.default,
    colorSplit: semantic.border.default,
    colorText: semantic.text.primary,
    colorTextSecondary: semantic.text.body,
    colorTextTertiary: semantic.text.muted,
    colorTextDisabled: semantic.text.disabled,
    colorTextPlaceholder: semantic.text.muted,
    // Clear icons, select arrows and empty-state icons; antd's default (black at 25%) is 1.9:1 on white.
    colorTextQuaternary: semantic.border.control,
    colorError: semantic.status.error,
    colorErrorBg: semantic.status.errorTint,
    colorSuccess: semantic.status.success,
    colorSuccessBg: semantic.status.successTint,
    colorWarning: semantic.status.warning,
    colorWarningBg: semantic.status.warningTint,
    colorInfo: semantic.status.info,
    colorInfoBg: semantic.status.infoTint,
    controlOutline: semantic.action.focusHalo,
    // The colour of every keyboard focus ring.
    colorPrimaryBorder: semantic.action.focus,
    controlItemBgActive: semantic.action.selectedWash,
    controlItemBgHover: semantic.surface.soft,

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

    motionDurationFast: seconds(motion.fast),
    motionDurationMid: seconds(motion.base),
    motionDurationSlow: seconds(motion.panel),
    motionEaseOut: motion.ease,
    motionEaseOutCirc: motion.ease,
  },
  components: {
    Layout: {
      bodyBg: semantic.surface.page,
      headerHeight: layout.headerHeight,
      headerPadding: `0 ${layout.contentPaddingX}px`,
    },
    Menu: {
      // The light menu of the small-screen drawer.
      itemSelectedBg: semantic.surface.selected,
      itemSelectedColor: semantic.text.primary,
      groupTitleColor: semantic.text.muted,
      groupTitleFontSize: typography.metadata.fontSize,
      itemHoverBg: semantic.surface.soft,
      itemHoverColor: semantic.text.primary,
      itemHeight: 40,
      itemBorderRadius: radius.md,
      activeBarBorderWidth: 0,
      itemMarginInline: spacing.sm,
      itemMarginBlock: 4,
    },
    Button: {
      defaultShadow: 'none',
      primaryShadow: 'none',
      dangerShadow: 'none',
      fontWeight: 500,
      defaultBorderColor: semantic.border.control,
    },
    Card: {
      colorBorderSecondary: semantic.border.hairline,
      headerHeight: component.card.headHeight,
      headerPadding: component.card.padding,
      bodyPadding: component.card.padding,
    },
    Table: {
      // Printed heads: ink on the parchment band, sentence case.
      headerBg: component.table.headBg,
      headerColor: component.table.headColor,
      headerSplitColor: 'transparent',
      rowHoverBg: component.table.rowHover,
      rowSelectedBg: component.table.rowSelected,
      rowSelectedHoverBg: component.table.rowSelected,
      cellPaddingBlock: component.table.rowPaddingBlock,
      cellPaddingBlockMD: component.table.rowPaddingBlock,
      cellPaddingBlockSM: component.table.rowPaddingBlockCompact,
      cellPaddingInline: component.table.cellPaddingInline,
      cellPaddingInlineMD: component.table.cellPaddingInline,
      cellPaddingInlineSM: component.table.cellPaddingInline,
      cellFontSize: component.table.fontSize,
      cellFontSizeMD: component.table.fontSize,
      cellFontSizeSM: component.table.fontSize,
      borderRadius: radius.lg,
    },
    Skeleton: {
      gradientFromColor: component.skeleton.from,
      gradientToColor: component.skeleton.to,
    },
    Breadcrumb: {
      fontSize: typography.metadata.fontSize,
      separatorColor: semantic.text.muted,
      itemColor: semantic.text.muted,
    },
    Input: {
      activeShadow: `0 0 0 3px ${semantic.action.focusHalo}`,
    },
    Select: {
      activeOutlineColor: semantic.action.focusHalo,
    },
    Tag: {
      defaultBg: semantic.surface.soft,
      defaultColor: semantic.text.body,
    },
    Drawer: {
      footerPaddingBlock: spacing.md - 4,
    },
    Modal: {
      boxShadow: shadows.xl,
    },
  },
}

/**
 * Reading surfaces (program detail, song-list review): layout, container and elevated backgrounds all take vellum, so a
 * dropdown or modal opened inside does not flash white. Nested under the root ConfigProvider.
 */
export const readingTheme: ThemeConfig = {
  token: {
    colorBgLayout: semantic.surface.reading,
    colorBgContainer: semantic.surface.reading,
    colorBgElevated: semantic.surface.reading,
  },
}
