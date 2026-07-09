/**
 * Helpers for working with WCAG (Web Content Accessibility Guidelines)
 * conformance levels.
 *
 * axe-core tags each accessibility rule with metadata that includes which
 * WCAG conformance level the rule maps to (e.g. "wcag2a", "wcag21aa").
 * These helpers turn that raw tag data into a simple 'A' | 'AA' | 'AAA'
 * value that UI components (like `WCAGBadge`) can render directly.
 *
 * Reference: https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#axe-core-tags
 */

/** The three WCAG conformance levels, from least to most strict. */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/**
 * Matches axe-core / standard WCAG tag strings such as:
 * "wcag2a", "wcag2aa", "wcag2aaa", "wcag21a", "wcag21aa", "wcag22aa".
 * Group 1 captures the trailing level ("a", "aa", or "aaa").
 */
const WCAG_LEVEL_TAG_PATTERN = /^wcag\d*(aaa|aa|a)$/i;

/**
 * Order in which levels are checked when multiple tags are present.
 * Level "A" is the most fundamental requirement (a page cannot conform to
 * AA or AAA without first meeting all Level A criteria), so it takes
 * priority when deciding which single level to display in a badge.
 */
const LEVEL_PRIORITY: WCAGLevel[] = ['A', 'AA', 'AAA'];

/**
 * Parses a single WCAG tag string into a normalized conformance level.
 *
 * @param tag - A raw tag string, e.g. "wcag2aa" or "WCAG2A".
 * @returns The matching WCAG level, or `null` if the tag isn't a
 *   recognized WCAG conformance-level tag (e.g. "cat.color" or "best-practice").
 *
 * @example
 * parseWcagLevel('wcag2aa'); // 'AA'
 * parseWcagLevel('cat.color'); // null
 */
export function parseWcagLevel(tag: string): WCAGLevel | null {
  const match = WCAG_LEVEL_TAG_PATTERN.exec(tag.trim());
  if (!match) {
    return null;
  }
  return match[1].toUpperCase() as WCAGLevel;
}

/**
 * Determines the most relevant WCAG conformance level referenced by a
 * list of tag strings. When several levels are present, "A" is preferred
 * over "AA", and "AA" is preferred over "AAA", because failing a
 * lower-level criterion is the more fundamental accessibility problem.
 *
 * @param tags - The list of WCAG-related tags associated with an issue
 *   (e.g. `issue.wcagCriteria`). Safe to pass `undefined`/`null`/`[]`.
 * @returns The most relevant WCAG level found, or `null` if no tag in the
 *   list maps to a WCAG conformance level.
 *
 * @example
 * getPrimaryWcagLevel(['wcag2aa', 'wcag143']); // 'AA'
 * getPrimaryWcagLevel(['wcag2a', 'wcag2aaa']); // 'A' (lower level wins)
 * getPrimaryWcagLevel(undefined); // null
 */
export function getPrimaryWcagLevel(
  tags: string[] | undefined | null
): WCAGLevel | null {
  if (!tags || tags.length === 0) {
    return null;
  }

  const foundLevels = new Set<WCAGLevel>();
  for (const tag of tags) {
    const level = parseWcagLevel(tag);
    if (level) {
      foundLevels.add(level);
    }
  }

  for (const level of LEVEL_PRIORITY) {
    if (foundLevels.has(level)) {
      return level;
    }
  }

  return null;
}
