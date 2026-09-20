import Delimited from '../delimited';
import type Files from '../files';
import type LineRange from '../line-range';
import type Tables from '../tables';
import { recordLinesOf } from './record-lines-of';

/** A delimited file read as a table: what the page draws, and the source lines each record covers. */
export type TableView = { table: Tables.Table; records: readonly LineRange.LineRange[] };

/**
 * A `.csv` or `.tsv` the pane draws as a table: parsed per RFC 4180, with the source lines of every
 * record beside it so a click on a drawn row selects the record's own lines.
 *
 * A file that does not parse, one whose records and lines disagree, and one the pane holds a window
 * of at a time all come back null: such a file draws as code, with its text unaltered.
 *
 * @param loaded the file the page shows
 * @returns the table and its records, or null when the file is not drawn as one
 */
export function tableViewOf(loaded: Files.LoadedFile): TableView | null {
  const separator = loaded.kind === 'table' ? Delimited.delimitedKindOf(loaded.path) : null;

  if (separator === null || loaded.note !== null || loaded.source !== 'whole') {
    return null;
  }

  const text = loaded.lines.join('\n');
  const table = Delimited.delimitedTableOf(text, separator);

  if (table === null) {
    return null;
  }

  const records = recordLinesOf(text, separator);

  // The two read the same text by the same rules, and a page built from records that do not match
  // the table would select the wrong lines: where they disagree the file draws as code instead.
  if (records.length !== table.rows.length + 1 || records.at(-1)?.end !== loaded.lines.length) {
    return null;
  }

  return { table, records };
}
