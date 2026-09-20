import { describe, expect, test, tier } from 'claude-code/testing';

import Files from '../hooks/files';
import TablePage from '../hooks/table-page';
import { CWD } from './fixtures';

tier('user');

const CSV = `${CWD}/data.csv`;

/** A file as `loadFile` hands it over: read whole, with its text split into lines. */
const loadedOf = (path: string, text: string) =>
  Files.loadedFileOf(path, { kind: 'file', size: text.length, mtimeMs: 1, isLink: false }, text);

describe('table-page', () => {
  test('a .csv reads as a table whose records name their own lines', () => {
    const view = TablePage.tableViewOf(loadedOf(CSV, 'name,count\nalice,1\nbob,2\n'));

    expect(view?.table.header).toEqual(['name', 'count']);
    expect(view?.table.rows).toEqual([
      ['alice', '1'],
      ['bob', '2'],
    ]);
    expect(view?.records, 'the records come from the same walk that read the table').toEqual([
      { start: 1, end: 1 },
      { start: 2, end: 2 },
      { start: 3, end: 3 },
    ]);
  });

  test('a file that does not parse, one of another kind and one held by windows have no table', () => {
    expect(TablePage.tableViewOf(loadedOf(CSV, 'name,note\nalice,"never closed\n')), 'an open quote').toBeNull();
    expect(TablePage.tableViewOf(loadedOf(CSV, '')), 'no record at all').toBeNull();
    expect(TablePage.tableViewOf(loadedOf(`${CWD}/notes.md`, 'a,b\nc,d\n')), 'not a delimited name').toBeNull();
    expect(
      TablePage.tableViewOf(
        Files.windowedFileOf(CSV, { kind: 'file', size: 9_000_000, mtimeMs: 1, isLink: false }, 400_000),
      ),
      'read one window at a time',
    ).toBeNull();
  });

  test('the page draws one block a record, against each other, the rules with the rows they close', () => {
    const view = TablePage.tableViewOf(loadedOf(CSV, 'name,count\nalice,1\nbob,2\n'))!;
    const page = TablePage.tablePageOf(view.table, view.records, 40);
    const textOf = (at: number) =>
      page.blocks[at]!.layout.segments.flatMap((segment) =>
        segment.kind === 'rows' ? segment.rows.map((row) => row.spans.map((span) => span.text).join('')) : [],
      );

    expect(page.gap, 'a blank row between two records would break the rules running down the table').toBe(0);
    expect(page.blocks.map((block) => block.firstRow)).toEqual([0, 3, 4]);
    expect(page.rows).toBe(6);
    expect(
      textOf(0).map((text) => text[0]),
      'the header keeps the rule above it and the one under it',
    ).toEqual(['┌', '│', '├']);
    expect(textOf(1).length, 'a record of one row draws one row').toBe(1);
    expect(
      textOf(2).map((text) => text[0]),
      'the last record closes the table',
    ).toEqual(['│', '└']);
    expect(textOf(1)[0]).toContain('alice');
  });

  test('a cell too long for its column wraps, and its record still covers those rows alone', () => {
    const wide = 'name,note\nalice,one two three four five six seven eight\nbob,short\n';
    const view = TablePage.tableViewOf(loadedOf(CSV, wide))!;
    const page = TablePage.tablePageOf(view.table, view.records, 24);

    expect(page.blocks[1]!.layout.rows, 'the wrapped cell takes more than one row').toBeGreaterThan(1);
    expect(page.blocks[2]!.firstRow).toBe(page.blocks[1]!.firstRow + page.blocks[1]!.layout.rows);
  });

  test('before any width is reported the page is one row a record', () => {
    const view = TablePage.tableViewOf(loadedOf(CSV, 'a,b\nc,d\n'))!;
    const page = TablePage.unmeasuredTablePageOf(view.records);

    expect(page.rows).toBe(2);
    expect(page.blocks.map((block) => block.firstRow)).toEqual([0, 1]);
  });

  test('every record names lines that hold it, a lone \\r among them', () => {
    // A lone `\r` ends a record for the parser but opens no line for the pane, and the trailing
    // blank line is the slack that used to let the mismatch through: the row reading `bob` named
    // line 4, which is empty, so a click on it sent Claude an empty line.
    const loaded = loadedOf(CSV, 'name,note\nalice,one\rtwo\nbob,3\n\n');
    const view = TablePage.tableViewOf(loaded)!;
    const firstCellOf = (at: number) => (at === 0 ? view.table.header[0] : view.table.rows[at - 1]![0])!;

    expect(view.records[3]).toEqual({ start: 3, end: 3 });
    expect(loaded.lines[2]).toBe('bob,3');

    for (const [at, record] of view.records.entries()) {
      const source = loaded.lines.slice(record.start - 1, record.end).join('\n');

      expect(source, `record ${at} names lines ${record.start}-${record.end}`).toContain(firstCellOf(at));
    }
  });
});
