import Limits from '../limits';
import Window from '../window';

/**
 * The lines one `Code` draws for a window: as many as the page has rows and the element's character
 * cap allows, each cut to the page's width and a margin.
 *
 * Cutting is what keeps a file of very long lines drawable: the engine refuses a whole drawing whose
 * `Code` source passes the cap ("Code source longer than 10000 characters"). What shows is the same,
 * since the page truncates every line at its right edge, and a selection reaches the model from the
 * file's own lines, never from here.
 *
 * LIMIT: on a page wider than the cap divided by its rows, a line longer than the cut shows cut.
 *
 * @param lines the lines held
 * @param from the 0-based line the window starts on, within `lines`
 * @param rows the rows the page draws
 * @param columns the page's width in cells
 * @returns the lines to hand `Code`
 */
export function codeSourceLinesOf(lines: readonly string[], from: number, rows: number, columns: number): string[] {
  const cut = Math.max(1, columns) + Limits.CUT_MARGIN_CHARS;
  const kept = Math.min(rows, Window.drawableRowsOf(columns));

  return lines.slice(from, from + kept).map((line) => (line.length > cut ? line.slice(0, cut) : line));
}
