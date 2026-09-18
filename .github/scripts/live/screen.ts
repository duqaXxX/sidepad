/**
 * Reading what the docked pane draws, from a plain capture of the terminal: one string a row.
 *
 * Everything here reads the screen a person sees, never the plugin's state, so a scenario's
 * assertion cannot share an assumption with the code it checks.
 */

/** The docked pane in a capture. */
export type Pane = {
  /** Screen column of the pane's first cell, right of its border, 0-based. */
  left: number;
  /** Screen row of the pane's top row, 0-based. */
  top: number;
  /** The pane's rows from its top row, each without the border and what lies left of it. */
  rows: string[];
};

/** A row of a code page: the line its gutter names, and whether the selection marks it. */
export type CodeRow = { row: number; line: number; isSelected: boolean };

const BORDER = '│';
const CLOSE_MARK = '✕';
const SELECTION_MARK = '▌';

/** A pane shorter than this is not the docked one: an inline pane or a stray box-drawing column. */
const MIN_PANE_ROWS = 10;

/**
 * Finds the docked pane: the column holding the border on the most rows, whose first bordered row
 * carries the engine's close mark.
 *
 * LIMIT: columns are counted in code points, so a wide character left of the border on a pane row
 * (an emoji in the transcript) shifts that row. The runner's sessions hold no model turn.
 *
 * @returns the pane, or null when none is drawn
 */
export function paneOf(screen: readonly string[]): Pane | null {
  const cells = screen.map((row) => [...row]);
  const counts = new Map<number, number>();

  for (const row of cells) {
    row.forEach((cell, column) => {
      if (cell === BORDER) counts.set(column, (counts.get(column) ?? 0) + 1);
    });
  }

  const [border, count] = [...counts].reduce((best, entry) => (entry[1] > best[1] ? entry : best), [-1, 0]);
  if (count < MIN_PANE_ROWS) return null;

  const top = cells.findIndex((row) => row[border] === BORDER);
  const rows: string[] = [];

  for (let at = top; at < cells.length && cells[at]![border] === BORDER; at += 1) {
    rows.push(cells[at]!.slice(border + 1).join(''));
  }

  return rows[0]?.includes(CLOSE_MARK) ? { left: border + 1, top, rows } : null;
}

/** The code page's rows: a marker cell, then the engine's gutter number. */
export function codeRowsOf(pane: Pane): CodeRow[] {
  return pane.rows.flatMap((text, row) => {
    const match = /^([ ▌]) *(\d+)(?: |$)/.exec(text);

    return match ? [{ row, line: Number(match[2]), isSelected: match[1] === SELECTION_MARK }] : [];
  });
}

/** The lines the selection marks, in the order drawn. */
export const selectedLinesOf = (pane: Pane) =>
  codeRowsOf(pane)
    .filter((row) => row.isSelected)
    .map((row) => row.line);

/** The range the command bar names (`lines a-b`), or null when no bar is drawn. */
export function barRangeOf(pane: Pane): { start: number; end: number } | null {
  for (const text of pane.rows) {
    const match = /(?:^|\s)lines (\d+)-(\d+)(?:\s|$)/.exec(text);
    if (match) return { start: Number(match[1]), end: Number(match[2]) };
  }

  return null;
}

/** The path the top row shows, `.` for the session directory. */
export function shownPathOf(pane: Pane): string | null {
  return /\s(\.(?:\/\S*)?)\s+✕/.exec(pane.rows[0] ?? '')?.[1] ?? null;
}

/** The row of a listing that names an entry, a directory ending with `/`, past its `●` marker. */
export function listingRowOf(pane: Pane, label: string): number | null {
  const row = pane.rows.findIndex((text, at) => at > 0 && text.replace(/^[ ●] ?/, '').trimEnd() === label);

  return row < 0 ? null : row;
}

/** The pane-relative column where a text starts on a row, or null. */
export function columnOf(pane: Pane, row: number, text: string): number | null {
  const at = pane.rows[row]?.indexOf(text) ?? -1;

  return at < 0 ? null : [...pane.rows[row]!.slice(0, at)].length;
}
