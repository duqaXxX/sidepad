import Delimited from '../delimited';
import type Files from '../files';
import type LineRange from '../line-range';
import type Tables from '../tables';

/** A delimited file read as a table: what the page draws, and the source lines each record covers. */
export type TableView = { table: Tables.Table; records: readonly LineRange.LineRange[] };

/**
 * A `.csv` or `.tsv` the pane draws as a table: parsed per RFC 4180, with the source lines of every
 * record beside it so a click on a drawn row selects the record's own lines. Both come from the one
 * walk `delimitedTableOf` makes, so they cannot disagree.
 *
 * A file that does not parse, and one the pane holds a window of at a time, come back null: such a
 * file draws as code, with its text unaltered.
 *
 * @param loaded the file the page shows
 * @returns the table and its records, or null when the file is not drawn as one
 */
export function tableViewOf(loaded: Files.LoadedFile): TableView | null {
  const separator = loaded.kind === 'table' ? Delimited.delimitedKindOf(loaded.path) : null;

  if (separator === null || loaded.note !== null || loaded.source !== 'whole') {
    return null;
  }

  const table = Delimited.delimitedTableOf(loaded.lines.join('\n'), separator);

  return table === null ? null : { table, records: table.records };
}
