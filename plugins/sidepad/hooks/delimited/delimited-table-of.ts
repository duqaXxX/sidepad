import type LineRange from '../line-range';
import type { Table } from '../tables/table';

// State machine states for the RFC 4180 field parser.
type State = 'normal' | 'quoted' | 'afterQuote';

/** One record as the parser read it: its fields, and the source lines it covers. */
type Record = { fields: string[]; start: number; end: number };

/**
 * A table parsed from a delimited file: the table, and the source lines each record covers, the
 * header's first. The two come from one walk of the text, so a drawn row and the lines a click on it
 * selects can never disagree.
 */
export type DelimitedTable = Table & {
  /** One range a record, 1-based and both ends included; `records[0]` is the header's. */
  records: readonly LineRange.LineRange[];
};

/**
 * A table parsed from RFC 4180 delimited text: first record as header, body records as rows, all
 * columns left-aligned, and the source lines of every record.
 *
 * Quoted fields may contain the separator, a newline, and `""` standing for one literal `"`. CRLF
 * and LF both end a record; a CRLF inside a quoted field is data. Rows with fewer fields than the
 * header are padded with empty cells; rows with more keep their extra cells and the header gains
 * empty names for those columns so no data is hidden. A quote in the middle of an unquoted field
 * is treated as a literal `"` rather than a parse error.
 *
 * A line is counted at a `\n`, which is how the pane splits a file into lines.
 *
 * LIMIT: a lone `\r` ends a record but opens no line, so every record of a file written with classic
 * Mac line endings names the one source line they share, and a click on any of them selects it whole.
 *
 * @param text the file's full content
 * @param separator the field delimiter, typically `,` or `\t`
 * @returns the table and its records, or null when text holds no records or contains an
 *   unterminated quoted field
 */
export function delimitedTableOf(text: string, separator: string): DelimitedTable | null {
  const parsed = parseRecords(text, separator);
  if (parsed === null || parsed.length === 0) return null;

  const header = [...parsed[0]!.fields];
  const rawRows = parsed.slice(1).map((record) => [...record.fields]);

  // First pass: grow the header to cover every row wider than it, so the final width is known.
  for (const row of rawRows) {
    while (header.length < row.length) header.push('');
  }

  // Second pass: pad every row to the final header width, which may be wider than it was when
  // the row was first seen (a later row may have expanded the header after this one was recorded).
  const rows = rawRows.map((row) => {
    while (row.length < header.length) row.push('');
    return row;
  });

  // Delimited files carry no alignment information: every column is left.
  const align = header.map(() => 'left' as const);
  const records = parsed.map(({ start, end }) => ({ start, end }));

  return { align, header, rows, records };
}

/** Parses text into records per RFC 4180, each with its lines. Returns null on an unterminated quoted field. */
function parseRecords(text: string, separator: string): Record[] | null {
  const records: Record[] = [];
  let fields: string[] = [];
  let field = '';
  let state: State = 'normal';
  let line = 1;
  let start = 1;

  /** Closes the record being read; `opensLine` is true for the terminators the pane splits lines on. */
  const endRecord = (opensLine: boolean) => {
    fields.push(field);
    field = '';
    records.push({ fields, start, end: line });
    fields = [];

    if (opensLine) line += 1;
    start = line;
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;

    if (state === 'normal') {
      if (ch === '"' && field === '') {
        state = 'quoted';
      } else if (ch === '"') {
        // A quote in the middle of an unquoted field is RFC 4180 invalid, but real files have it.
        // Treat as a literal `"` to preserve data rather than rejecting the file.
        field += ch;
      } else if (ch === separator) {
        fields.push(field);
        field = '';
      } else if (ch === '\r') {
        const isCrLf = text[i + 1] === '\n';

        if (isCrLf) i++;
        endRecord(isCrLf);
      } else if (ch === '\n') {
        endRecord(true);
      } else {
        field += ch;
      }
    } else if (state === 'quoted') {
      if (ch === '"') {
        state = 'afterQuote';
      } else {
        // Any character inside quotes, including separator and newline, is data.
        if (ch === '\n') line += 1;
        field += ch;
      }
    } else {
      // afterQuote: the previous character was `"` inside a quoted field.
      if (ch === '"') {
        // `""` encodes one literal quote inside a quoted field.
        field += '"';
        state = 'quoted';
      } else if (ch === separator) {
        fields.push(field);
        field = '';
        state = 'normal';
      } else if (ch === '\r') {
        const isCrLf = text[i + 1] === '\n';

        if (isCrLf) i++;
        endRecord(isCrLf);
        state = 'normal';
      } else if (ch === '\n') {
        endRecord(true);
        state = 'normal';
      } else {
        // Character after a closing quote that is neither separator, newline nor another quote.
        // By the same rule that keeps a mid-field `"` in an unquoted field: sidepad shows what is
        // in the file, so the closing quote is kept as a literal `"` and the character is kept too.
        field += `"${ch}`;
        state = 'normal';
      }
    }
  }

  // An unterminated quoted field means the file does not parse.
  if (state === 'quoted') return null;

  // Flush the last field and record when there is pending content. A file ending with a newline
  // already flushed its last record in the loop above; here fields and field are both empty, so
  // the condition prevents a spurious trailing empty record.
  if (fields.length > 0 || field !== '' || state === 'afterQuote') {
    fields.push(field);
    records.push({ fields, start, end: line });
  }

  return records;
}
