/**
 * The least scroll, in page rows, that shows a block: down until its last row is in view, up to its
 * first row when the block sits above the window or is taller than it.
 *
 * @param top the window's 0-based first row
 * @param firstRow the block's 0-based first row on the page
 * @param rows the rows the block draws
 * @param shownRows the rows the window shows above the bar
 * @returns the new 0-based first row, before clamping
 */
export function revealedBlockTopOf(top: number, firstRow: number, rows: number, shownRows: number): number {
  const shown = Math.max(1, shownRows);
  const height = Math.max(1, rows);

  if (height > shown || firstRow < top) {
    return firstRow;
  }

  return firstRow + height > top + shown ? firstRow + height - shown : top;
}
