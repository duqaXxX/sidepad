/**
 * A window's first row kept inside what it scrolls: never above the first row, never so low that
 * the last row sits above the window's end.
 *
 * @param top the 0-based first row wanted
 * @param total how many rows there are
 * @param shownRows how many rows the window shows
 * @returns the clamped first row
 */
export const clampedTopOf = (top: number, total: number, shownRows: number) =>
  Math.max(0, Math.min(Math.max(0, total - shownRows), top));
