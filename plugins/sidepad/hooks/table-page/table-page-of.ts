import type BlockLayout from '../block-layout';
import type LineRange from '../line-range';
import type { PageLayout, PlacedBlock } from '../page-layout/page-layout';
import type { Row } from '../spans';
import Tables from '../tables';

/**
 * The page last built for a table, kept because the page is a pure function of the table, its
 * records and the width, while a drawing, a scroll and every pointer event ask for it again. The key
 * is the record list, which a reload replaces, and the entry goes when nothing holds it.
 */
const CACHE = new WeakMap<readonly LineRange.LineRange[], { table: Tables.Table; columns: number; page: PageLayout }>();

/** What an unmeasured record draws: one blank row, so a page of them is self-consistent. */
const UNMEASURED_RECORD: BlockLayout.BlockLayout = { segments: [{ kind: 'rows', rows: [{ spans: [] }] }], rows: 1 };

/**
 * A page for records nobody has reported a width for: one row a record, placed without drawing the
 * table. Drawing it at a guessed width costs what the real drawing costs and the first drawing
 * throws it away.
 *
 * @param records the source lines of each record
 * @returns the placed blocks and the page's rows
 */
export const unmeasuredTablePageOf = (records: readonly LineRange.LineRange[]): PageLayout => ({
  blocks: records.map((_, at) => ({ firstRow: at, layout: UNMEASURED_RECORD })),
  rows: records.length,
  gap: 0,
});

/** One drawn table row, bold where it is the header's. */
const rowOf = (row: Tables.TableRow): Row => ({
  spans: [row.isHeader ? { text: row.text, bold: true } : { text: row.text }],
});

/**
 * A delimited file's page: the table drawn at the page's width, cut into one block a record so a
 * click selects the record's own source lines. The header's block carries the top rule, the header
 * cells and the rule under them; the last record's carries the bottom rule.
 *
 * The blocks sit against each other: the table is one drawing, and a blank row between two of its
 * rows would break the rules running down it.
 *
 * @param table the parsed table
 * @param records the source lines of each record, the header's first
 * @param columns the page's width in cells
 * @returns the placed blocks and the page's rows
 */
export function tablePageOf(table: Tables.Table, records: readonly LineRange.LineRange[], columns: number): PageLayout {
  const held = CACHE.get(records);

  if (held && held.table === table && held.columns === columns) {
    return held.page;
  }

  const drawn = Tables.tableRowsOf(table, columns);
  const grouped: Row[][] = records.map(() => []);
  let group = 0;

  for (const row of drawn) {
    if (row.body >= 0) {
      group = row.body + 1;
    }

    grouped[Math.min(group, grouped.length - 1)]?.push(rowOf(row));
  }

  const placed: PlacedBlock[] = [];
  let at = 0;

  for (const rows of grouped) {
    const layout: BlockLayout.BlockLayout = { segments: [{ kind: 'rows', rows }], rows: rows.length };

    placed.push({ firstRow: at, layout });
    at += rows.length;
  }

  const page: PageLayout = { blocks: placed, rows: at, gap: 0 };

  CACHE.set(records, { table, columns, page });

  return page;
}
