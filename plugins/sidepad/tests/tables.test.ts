import { describe, expect, test, tier } from 'claude-code/testing';

import Tables from '../hooks/tables';

tier('user');

const SOURCE = [
  '| Limit | Set by | Measured on |',
  '|:--|:-:|--:|',
  '| **Read cap** | sidepad | a file past 2 MB opens by windows of lines, never whole |',
  '| Element cap | `Claude Code` | one Markdown element holds at most 10,000 characters |',
];

describe('tables', () => {
  const table = Tables.tableOf(SOURCE)!;

  test('a table is read with its alignments and its cells as plain text', () => {
    expect(table.header).toEqual(['Limit', 'Set by', 'Measured on']);
    expect(table.align).toEqual(['left', 'center', 'right']);
    expect(table.rows[0]).toEqual(['Read cap', 'sidepad', 'a file past 2 MB opens by windows of lines, never whole']);
    expect(Tables.tableOf(['not a table'])).toBeNull();
  });

  test('every drawn row is one width, and a cell too long for its column wraps', () => {
    const rows = Tables.tableRowsOf(table, 60);
    const widths = new Set(rows.map((row) => [...row.text].length));

    expect([...widths], 'one width, the page or narrower').toEqual([60]);
    expect(rows[0]!.text.startsWith('┌') && rows.at(-1)!.text.startsWith('└')).toBe(true);
    expect(rows.filter((row) => row.isHeader).length, 'the header fits one row here').toBe(1);
    // The first body row: every drawn row of it, its third column read back word by word.
    const body = rows.slice(rows.findIndex((row) => row.text.includes('Read cap')));
    const wrapped = body
      .slice(
        0,
        body.findIndex((row) => row.text.includes('Element cap')),
      )
      .map((row) => row.text.split('│')[3]!.trim())
      .filter((cell) => cell !== '')
      .join(' ');

    expect(wrapped, 'the long cell wrapped inside its column').toBe(table.rows[0]![2]);
    expect(rows.length, 'three rules, a header row and the wrapped body rows').toBeGreaterThan(6);
  });

  test('a column is padded where its alignment asks', () => {
    const [header] = Tables.tableRowsOf(table, 60).filter((row) => row.isHeader);
    const cells = header!.text.split('│').slice(1, -1);

    expect(cells[0]!.startsWith(' Limit'), 'left').toBe(true);
    expect(cells[2]!.endsWith('Measured on '), 'right').toBe(true);
    expect(cells[1]!.startsWith('  ') && cells[1]!.endsWith('  '), 'centred').toBe(true);
  });

  test('a table with no room for its columns is drawn at its smallest', () => {
    const rows = Tables.tableRowsOf(table, 10);
    const widths = new Set(rows.map((row) => [...row.text].length));

    expect(widths.size, 'still one width').toBe(1);
    expect([...widths][0]!, 'wider than the page, which cuts it').toBeGreaterThan(10);
  });
});
