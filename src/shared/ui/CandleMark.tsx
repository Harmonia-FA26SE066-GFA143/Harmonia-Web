import { colors, gold } from '@/styles/tokens'

/**
 * A small line-drawn candle, one of the three motifs the redesign allows (brief 2026-10-31 §5), here only on empty
 * states. Gold is the flame's decoration, never a status; the candle carries no meaning and is hidden from readers.
 */
export function CandleMark() {
  return (
    <svg aria-hidden width={24} height={32} viewBox="0 0 24 32" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5c2.4 2.9 3.4 4.9 3.4 6.8a3.4 3.4 0 0 1-6.8 0c0-1.9 1-3.9 3.4-6.8z" fill={gold.soft} stroke={gold.line} />
      <path d="M12 12.7v1.8" stroke={colors.textMuted} />
      <rect x="8.5" y="14.5" width="7" height="14" rx="1" stroke={colors.textMuted} />
      <path d="M5.5 30.5h13" stroke={colors.textMuted} />
    </svg>
  )
}
