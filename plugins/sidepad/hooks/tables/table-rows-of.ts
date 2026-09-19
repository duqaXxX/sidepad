import Limits from '../limits';
import type { Table, TableAlign, TableRow } from './table';

const RULES = { top: '┌┬┐', middle: '├┼┤', bottom: '└┴┘' } as const;

const widthOf = (text: string) => [...text].length;

/** A cell's text cut into lines of `width`, a word too long for a line broken across lines. */
function wrapped(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';

  for (const word of text.split(/\s+/).filter((piece) => piece !== '')) {
    for (let rest = word; rest !== ''; ) {
      const room = width - (line === '' ? 0 : widthOf(line) + 1);

      if (widthOf(rest) <= room) {
        line = line === '' ? rest : `${line} ${rest}`;
        break;
      }

      if (line !== '') {
        lines.push(line);
        line = '';
        continue;
      }

      lines.push([...rest].slice(0, width).join(''));
      rest = [...rest].slice(width).join('');
    }
  }

  if (line !== '') lines.push(line);

  return lines.length > 0 ? lines : [''];
}

/** A cell padded to its column's width, where its alignment asks. */
function laid(text: string, width: number, align: TableAlign): string {
  const room = Math.max(0, width - widthOf(text));

  if (align === 'right') return ' '.repeat(room) + text;
  if (align === 'center') return ' '.repeat(Math.floor(room / 2)) + text + ' '.repeat(Math.ceil(room / 2));

  return text + ' '.repeat(room);
}

/**
 * The columns' widths: what each column's longest cell asks for, shrunk from the widest down while
 * they do not fit, never below `TABLE_MIN_CELL`.
 */
function widthsOf(table: Table, room: number): number[] {
  const columns = table.header.length;
  const widths = table.header.map((cell, at) =>
    Math.max(widthOf(cell), ...table.rows.map((row) => widthOf(row[at] ?? ''))),
  );
  const floor = Math.max(1, Math.min(Limits.TABLE_MIN_CELL, Math.floor(room / Math.max(1, columns))));

  for (let total = widths.reduce((sum, width) => sum + width, 0); total > room; total -= 1) {
    const widest = widths.indexOf(Math.max(...widths));

    if ((widths[widest] ?? 0) <= floor) break;
    widths[widest] = (widths[widest] ?? 0) - 1;
  }

  return widths;
}

/**
 * A table drawn at `columns` cells: box-drawing rules, one cell per column padded where its
 * alignment asks, a cell too long for its column wrapped onto more rows. The engine's `Markdown`
 * sizes a table by a width of its own, which no plugin sets (#51), so the pane draws its own.
 *
 * LIMIT: a table whose columns cannot fit, even at their smallest, is drawn wider than the page and
 * cut at its right edge.
 *
 * @param table the table read from the block
 * @param columns the page's width in cells
 * @returns the rows to draw, top rule first
 */
export function tableRowsOf(table: Table, columns: number): TableRow[] {
  const count = table.header.length;
  const overhead = count + 1 + 2 * count;
  const widths = widthsOf(table, Math.max(count, columns - overhead));
  const rule = (kind: keyof typeof RULES): TableRow => {
    const [left, join, right] = [...RULES[kind]] as [string, string, string];

    return { text: left + widths.map((width) => '─'.repeat(width + 2)).join(join) + right, isHeader: false };
  };
  const cells = (row: readonly string[], isHeader: boolean): TableRow[] => {
    const wraps = widths.map((width, at) => wrapped(row[at] ?? '', width));
    const height = Math.max(...wraps.map((lines) => lines.length));

    return Array.from({ length: height }, (_, line) => ({
      isHeader,
      text: `│ ${widths.map((width, at) => laid(wraps[at]![line] ?? '', width, table.align[at] ?? 'left')).join(' │ ')} │`,
    }));
  };

  return [
    rule('top'),
    ...cells(table.header, true),
    rule('middle'),
    ...table.rows.flatMap((row) => cells(row, false)),
    rule('bottom'),
  ];
}
