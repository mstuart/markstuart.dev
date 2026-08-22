const MIN_DISPLAYED_STARS = 50;

/**
 * Formats a repo star count for display, e.g. 2123 -> "2.1k".
 * Returns null when the count is below the display threshold, meaning
 * callers should render no star count at all (no icon, no gap).
 */
export function formatStarCount(stars: number): string | null {
  if (stars < MIN_DISPLAYED_STARS) {
    return null;
  }
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return String(stars);
}
