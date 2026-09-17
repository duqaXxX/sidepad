import type LineRange from '../line-range';
import { clampedTopOf } from './clamped-top-of';

/**
 * The least scroll that shows a selection in a window of lines: all of it when it fits, else the
 * line the drag ended on.
 *
 * @param top the window's 0-based first line
 * @param range the selection
 * @param head the line the drag ended on, 1-based
 * @param shownRows the lines the window shows above the bar
 * @param total the file's lines
 * @returns the new 0-based first line, `top` when nothing is hidden
 */
export function revealedTopOf(
  top: number,
  range: LineRange.LineRange,
  head: number,
  shownRows: number,
  total: number,
): number {
  const shown = Math.max(1, shownRows);
  const fits = range.end - range.start + 1 <= shown;
  const low = fits ? range.start : head;
  const high = fits ? range.end : head;

  if (high > top + shown) {
    return clampedTopOf(high - shown, total, shown);
  }

  return low < top + 1 ? clampedTopOf(low - 1, total, shown) : top;
}
