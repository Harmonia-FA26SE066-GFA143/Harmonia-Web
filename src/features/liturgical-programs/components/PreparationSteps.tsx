import { CheckOutlined } from '@ant-design/icons'
import { Flex, Typography } from 'antd'
import { useReducedMotion } from '@/shared/ui'
import { colors, motion, sections, spacing, typography } from '@/styles/tokens'
import { currentStepIndex, type PreparationStep, type StepState } from '../preparationSteps'

export interface PreparationStepsProps {
  steps: PreparationStep[]
  /**
   * Hang the bookmark ribbon over the current step. One ribbon per view (DESIGN.md): leave it off where the season
   * banner already carries one.
   */
  bookmark?: boolean
}

const ribbonHeight = 36

const markerStyle = (state: StepState, current: boolean) => {
  const tone = state === 'waiting' ? sections.attention.cloth : state === 'done' || current ? colors.primary : colors.mutedBorder
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: `2px solid ${tone}`,
    background: state === 'done' ? colors.primary : current ? colors.primarySoft : colors.surface,
    color: state === 'done' ? colors.surface : state === 'waiting' ? sections.attention.ink : current ? colors.primary : colors.textMuted,
    fontSize: 13,
    fontWeight: 600,
  } as const
}

/**
 * The six preparation steps, numbered 1–6, with the current one marked and named in words ("Bước 3/6"), never a
 * percentage. A done step shows a check, a step waiting on the viewer an ochre ring; each step's value states it in
 * words. The optional bookmark ribbon hangs over the current step and slides when it moves (the one motion of the
 * redesign); with reduced motion it moves at once.
 */
export function PreparationSteps({ steps, bookmark = false }: Readonly<PreparationStepsProps>) {
  const reduced = useReducedMotion()
  const current = currentStepIndex(steps)
  const step = steps[current]

  return (
    <div>
      <Typography.Text style={{ display: 'block', marginBottom: spacing.md }}>
        <strong style={{ fontWeight: 600 }}>
          Bước {current + 1}/{steps.length}:
        </strong>{' '}
        {step.label} · {step.value}
      </Typography.Text>
      <div style={{ position: 'relative', paddingTop: bookmark ? ribbonHeight + spacing.sm : 0 }}>
        {bookmark && (
          <div
            aria-hidden
            data-testid="step-bookmark"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${100 / steps.length}%`,
              transform: `translateX(${current * 100}%)`,
              transition: reduced ? 'none' : `transform ${motion.bookmarkMs}ms ${motion.easeOut}`,
            }}
          >
            <span
              style={{
                display: 'block',
                width: 16,
                height: ribbonHeight,
                marginInlineStart: 6,
                background: colors.primary,
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)',
              }}
            />
          </div>
        )}
        <ol
          aria-label="Các bước chuẩn bị"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`, margin: 0, padding: 0, listStyle: 'none' }}
        >
          {steps.map((item, index) => {
            const isCurrent = index === current
            return (
              <li key={item.label} aria-current={isCurrent ? 'step' : undefined} style={{ minWidth: 0, paddingInlineEnd: spacing.sm }}>
                <Flex align="center" style={{ marginBottom: spacing.sm }}>
                  <span aria-hidden style={markerStyle(item.state, isCurrent)}>
                    {item.state === 'done' ? <CheckOutlined /> : index + 1}
                  </span>
                  {index < steps.length - 1 && (
                    <span
                      aria-hidden
                      style={{ flex: 1, height: 2, marginInline: spacing.sm, background: item.state === 'done' ? colors.primary : colors.border }}
                    />
                  )}
                </Flex>
                <Typography.Text
                  style={{ display: 'block', fontSize: 13, fontWeight: isCurrent ? 600 : 500, color: isCurrent ? colors.textPrimary : colors.textMuted }}
                >
                  {index + 1}. {item.label}
                </Typography.Text>
                <Typography.Text
                  style={{ display: 'block', fontWeight: 600, color: item.state === 'waiting' ? sections.attention.ink : colors.textPrimary }}
                >
                  {item.value}
                </Typography.Text>
                {item.note && (
                  <Typography.Text style={{ display: 'block', color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
                    {item.note}
                  </Typography.Text>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
