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

/** A row of a code page: the line its gutter names, the text drawn after it, and whether the selection marks it. */
export type CodeRow = { row: number; line: number; text: string; isSelected: boolean };

const BORDER = '│';
const CLOSE_MARK = '✕';
const SELECTION_MARK = '▌';

/** The page's first row in a pane: below the top row and the rule under it. */
export const PAGE_TOP = 2;

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

/**
 * The code page's rows: the page's one cell of padding, a marker cell, the engine's gutter number, a
 * space, then the line's text.
 *
 * LIMIT: Claude Code 2.1.278 numbers no trailing blank line of a `Code` (#39), so a window ending on
 * a selected blank line draws its row as the marker alone. Such a row right below a code row is read
 * as the next line; an unselected one draws nothing and is not read at all.
 */
export function codeRowsOf(pane: Pane): CodeRow[] {
  const rows: CodeRow[] = [];

  pane.rows.forEach((drawn, row) => {
    const match = /^ ([ ▌]) *(\d+)(?: (.*)|$)/.exec(drawn);
    const above = rows.at(-1);

    if (match) {
      rows.push({
        row,
        line: Number(match[2]),
        text: (match[3] ?? '').trimEnd(),
        isSelected: match[1] === SELECTION_MARK,
      });
    } else if (above?.row === row - 1 && drawn.trimEnd() === ` ${SELECTION_MARK}`) {
      rows.push({ row, line: above.line + 1, text: '', isSelected: true });
    }
  });

  return rows;
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

/**
 * The row of a listing that names an entry, a directory ending with `/`, past the page's one cell of
 * padding and its `●` marker.
 */
export function listingRowOf(pane: Pane, label: string): number | null {
  const row = pane.rows.findIndex((text, at) => at >= PAGE_TOP && text.replace(/^ [ ●] ?/, '').trimEnd() === label);

  return row < 0 ? null : row;
}

/**
 * The status line's two texts, read off the body's last row, where the page's mode sits on the left
 * and where the page is on the right; null when that row holds no status. The pane's last bordered
 * row is its frame, where nothing drawn shows, so the body's last row is the one above it.
 */
export function statusOf(pane: Pane): { left: string; right: string } | null {
  const match = /^ (\S*)\s+(.*\S)\s*$/.exec(pane.rows.at(-2) ?? '');

  return match ? { left: match[1]!, right: match[2]! } : null;
}

/** The pane-relative column where a text starts on a row, or null. */
export function columnOf(pane: Pane, row: number, text: string): number | null {
  const at = pane.rows[row]?.indexOf(text) ?? -1;

  return at < 0 ? null : [...pane.rows[row]!.slice(0, at)].length;
}
