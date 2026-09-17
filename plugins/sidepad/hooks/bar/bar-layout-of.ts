import Limits from '../limits';
import type LineRange from '../line-range';
import Names from '../names';
import type { BarItem } from './bar-item';

// Every label and hint word is one cell per code point (ASCII and `…`).
const widthOf = (item: BarItem) =>
  item.kind === 'button' ? [...item.label].length + Limits.BUTTON_CHROME : [...item.text].length;

/**
 * The band's rows at a width: its items packed greedily left to right, one cell between items, a
 * new row when the next does not fit. Computed here rather than left to `flexWrap`, so the hooks
 * know how many rows the bar covers for the scroll limit, the pointer guard and the reveal.
 *
 * LIMIT: an item wider than the room keeps a row of its own and is clipped.
 *
 * @param range the selected lines
 * @param isAsking whether Ask… was pressed: the hint replaces the Buttons
 * @param columns the body's width in cells
 * @returns the rows, at least one
 */
export function barLayoutOf(range: LineRange.LineRange, isAsking: boolean, columns: number): BarItem[][] {
  const room = Math.max(1, columns - 2 * Limits.BAR_PADDING);
  const items: BarItem[] = [
    { kind: 'label', text: `lines ${range.start}-${range.end}` },
    ...(isAsking
      ? Names.ASK_HINT.split(' ').map((text): BarItem => ({ kind: 'hint', text }))
      : Names.BAR_COMMANDS.map((command): BarItem => ({ kind: 'button', id: command.id, label: command.label }))),
  ];
  const rows: BarItem[][] = [[]];
  let used = 0;

  for (const item of items) {
    const width = widthOf(item);
    const row = rows.at(-1)!;
    const needed = row.length === 0 ? width : used + 1 + width;

    if (row.length > 0 && needed > room) {
      rows.push([item]);
      used = width;
    } else {
      row.push(item);
      used = needed;
    }
  }

  return rows;
}
