import type { Table } from '../tables/table';

// State machine states for the RFC 4180 field parser.
type State = 'normal' | 'quoted' | 'afterQuote';

/**
 * A table parsed from RFC 4180 delimited text: first record as header, body records as rows, all
 * columns left-aligned.
 *
 * Quoted fields may contain the separator, a newline, and `""` standing for one literal `"`. CRLF
 * and LF both end a record; a CRLF inside a quoted field is data. Rows with fewer fields than the
 * header are padded with empty cells; rows with more keep their extra cells and the header gains
 * empty names for those columns so no data is hidden. A quote in the middle of an unquoted field
 * is treated as a literal `"` rather than a parse error.
 *
 * @param text the file's full content
 * @param separator the field delimiter, typically `,` or `\t`
 * @returns the table, or null when text holds no records or contains an unterminated quoted field
 */
export function delimitedTableOf(text: string, separator: string): Table | null {
  const records = parseRecords(text, separator);
  if (records === null || records.length === 0) return null;

  const header = [...records[0]!];
  const bodyRecords = records.slice(1);
  const rows: string[][] = [];

  for (const record of bodyRecords) {
    const row = [...record];
    if (row.length > header.length) {
      // The row is wider than the header: grow the header with empty names so no cells are hidden.
      while (header.length < row.length) header.push('');
    } else {
      // Pad a short row to the header width.
      while (row.length < header.length) row.push('');
    }
    rows.push(row);
  }

  // Delimited files carry no alignment information: every column is left.
  const align = header.map(() => 'left' as const);

  return { align, header, rows };
}

/** Parses text into records per RFC 4180. Returns null on an unterminated quoted field. */
function parseRecords(text: string, separator: string): string[][] | null {
  const records: string[][] = [];
  let fields: string[] = [];
  let field = '';
  let state: State = 'normal';

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
        if (text[i + 1] === '\n') i++;
        fields.push(field);
        field = '';
        records.push(fields);
        fields = [];
      } else if (ch === '\n') {
        fields.push(field);
        field = '';
        records.push(fields);
        fields = [];
      } else {
        field += ch;
      }
    } else if (state === 'quoted') {
      if (ch === '"') {
        state = 'afterQuote';
      } else {
        // Any character inside quotes, including separator and newline, is data.
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
        if (text[i + 1] === '\n') i++;
        fields.push(field);
        field = '';
        records.push(fields);
        fields = [];
        state = 'normal';
      } else if (ch === '\n') {
        fields.push(field);
        field = '';
        records.push(fields);
        fields = [];
        state = 'normal';
      } else {
        // Character after a closing quote that is neither separator, newline nor another quote.
        // Lenient: treat the prior closing quote as literal and continue collecting characters.
        state = 'normal';
        field += ch;
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
    records.push(fields);
  }

  return records;
}
