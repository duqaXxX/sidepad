import type LineRange from '../line-range';

/**
 * The source lines each record of a delimited file covers, 1-based and both ends included. A quoted
 * field may hold a newline, so a record is not always one line.
 *
 * The record boundaries follow the same rules `delimitedTableOf` parses by, since a selection is
 * only right while the two agree: `"` opens a quoted field at a field's start alone, `""` inside one
 * is a literal quote, and a record ends on a newline outside quotes. `tableViewOf` checks the two
 * agree on how many records the file holds before a page is built from them.
 *
 * LIMIT: a lone `\r` ends a record but opens no line, since the pane splits a file on `\n` alone, so
 * a file whose lines end with one (classic Mac) counts more records than it has lines; `tableViewOf`
 * sees the last record end past the file and draws the file as code.
 *
 * @param text the file's full content
 * @param separator the field delimiter
 * @returns one range a record, in order; empty when the text holds no record
 */
export function recordLinesOf(text: string, separator: string): LineRange.LineRange[] {
  const records: LineRange.LineRange[] = [];
  let state: 'normal' | 'quoted' | 'afterQuote' = 'normal';
  let isFieldEmpty = true;
  let line = 1;
  let start = 1;
  let isOpen = false;

  const close = () => {
    records.push({ start, end: line });
    start = line + 1;
    isFieldEmpty = true;
    isOpen = false;
  };

  for (let at = 0; at < text.length; at += 1) {
    const ch = text[at]!;
    const isNewline = ch === '\n' || (ch === '\r' && state !== 'quoted');

    if (state === 'quoted') {
      if (ch === '"') {
        state = 'afterQuote';
      } else if (ch === '\n') {
        line += 1;
      }
      isOpen = true;
      continue;
    }

    if (isNewline) {
      if (ch === '\r' && text[at + 1] === '\n') at += 1;
      close();
      line += 1;
      state = 'normal';
      continue;
    }

    isOpen = true;

    if (state === 'afterQuote') {
      state = 'normal';

      if (ch === '"') {
        state = 'quoted';
      } else if (ch === separator) {
        isFieldEmpty = true;
      } else {
        isFieldEmpty = false;
      }
      continue;
    }

    if (ch === '"' && isFieldEmpty) {
      state = 'quoted';
    } else if (ch === separator) {
      isFieldEmpty = true;
    } else {
      isFieldEmpty = false;
    }
  }

  // A file ending with a newline closed its last record in the loop; one that does not ends here.
  if (isOpen || state === 'afterQuote') {
    records.push({ start, end: line });
  }

  return records;
}
