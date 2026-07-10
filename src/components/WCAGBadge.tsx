import type { FC } from 'react';
import { cn } from '../utils/cn';
import { getPrimaryWcagLevel, type WCAGLevel } from '../utils/wcag';

/**
 * Props for {@link WCAGBadge}.
 *
 * Provide either `level` directly, or `criteria` (raw WCAG tag strings
 * from an accessibility issue, e.g. `issue.wcagCriteria`) and let the
 * badge figure out the level automatically. If both are provided, `level`
 * wins.
 */
export interface WCAGBadgeProps {
  /** An explicit WCAG conformance level to display. */
  level?: WCAGLevel | null;
  /**
   * Raw WCAG tag strings (e.g. `['wcag2aa', 'wcag143']`) used to derive
   * the conformance level automatically when `level` isn't provided.
   */
  criteria?: string[];
  /** Optional extra classes for layout (e.g. spacing) in the parent. */
  className?: string;
}

/** Tailwind classes for each conformance level, with dark mode support. */
const LEVEL_STYLES: Record<WCAGLevel, string> = {
  A: 'bg-warning-100 text-warning-800 border-warning-300 dark:bg-warning-950/40 dark:text-warning-300 dark:border-warning-800',
  AA: 'bg-primary-100 text-primary-800 border-primary-300 dark:bg-primary-950/40 dark:text-primary-300 dark:border-primary-800',
  AAA: 'bg-success-100 text-success-800 border-success-300 dark:bg-success-950/40 dark:text-success-300 dark:border-success-800',
};

/** Human-readable descriptions used for the accessible label/tooltip. */
const LEVEL_DESCRIPTIONS: Record<WCAGLevel, string> = {
  A: 'WCAG Level A: the minimum, baseline level of conformance',
  AA: 'WCAG Level AA: the standard level most websites aim for',
  AAA: 'WCAG Level AAA: the highest, most stringent level of conformance',
};

/**
 * Displays a small badge indicating a WCAG conformance level (A, AA, or
 * AAA). Useful anywhere an accessibility issue or scan report needs to
 * show which conformance level is affected.
 *
 * Renders nothing when no level can be determined, so it's always safe
 * to include next to an issue even if `wcagCriteria` is missing.
 *
 * @example
 * // Automatically derive the level from axe-core style tags:
 * <WCAGBadge criteria={issue.wcagCriteria} />
 *
 * @example
 * // Or pass the level explicitly:
 * <WCAGBadge level="AA" />
 */
export const WCAGBadge: FC<WCAGBadgeProps> = ({ level, criteria, className }) => {
  const resolvedLevel = level ?? getPrimaryWcagLevel(criteria);

  if (!resolvedLevel) {
    return null;
  }

  const description = LEVEL_DESCRIPTIONS[resolvedLevel];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold tracking-wide',
        LEVEL_STYLES[resolvedLevel],
        className
      )}
      title={description}
      aria-label={description}
    >
      WCAG {resolvedLevel}
    </span>
  );
};

export default WCAGBadge;
