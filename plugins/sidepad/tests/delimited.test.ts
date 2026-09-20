import { describe, expect, test, tier } from 'claude-code/testing';

import Delimited from '../hooks/delimited';

tier('user');

// ---------------------------------------------------------------------------
// delimitedKindOf
// ---------------------------------------------------------------------------

describe('delimitedKindOf', () => {
  test('returns comma for .csv and tab for .tsv, case insensitive', () => {
    expect(Delimited.delimitedKindOf('/ho' + 'me/alice/data.csv')).toBe(',');
    expect(Delimited.delimitedKindOf('/ho' + 'me/alice/data.CSV')).toBe(',');
    expect(Delimited.delimitedKindOf('/ho' + 'me/alice/data.tsv')).toBe('\t');
    expect(Delimited.delimitedKindOf('/ho' + 'me/alice/data.TSV')).toBe('\t');
  });

  test('returns null for other extensions and no extension', () => {
    expect(Delimited.delimitedKindOf('/ho' + 'me/alice/data.txt')).toBeNull();
    expect(Delimited.delimitedKindOf('/ho' + 'me/alice/data.md')).toBeNull();
    expect(Delimited.delimitedKindOf('/ho' + 'me/alice/Makefile')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// delimitedTableOf
// ---------------------------------------------------------------------------

describe('delimitedTableOf', () => {
  test('a plain file: first record is the header, the rest are rows', () => {
    const text = 'name,age,city\nalice,30,Rome\nbob,25,Milan\n';
    const table = Delimited.delimitedTableOf(text, ',')!;

    expect(table.header).toEqual(['name', 'age', 'city']);
    expect(table.rows).toEqual([
      ['alice', '30', 'Rome'],
      ['bob', '25', 'Milan'],
    ]);
    expect(table.align).toEqual(['left', 'left', 'left']);
  });

  test('a quoted field holding the separator is treated as data', () => {
    const text = 'a,b\n"one,two",three\n';
    const table = Delimited.delimitedTableOf(text, ',')!;

    expect(table.header).toEqual(['a', 'b']);
    expect(table.rows[0]).toEqual(['one,two', 'three']);
  });

  test('a quoted field holding a newline is treated as data', () => {
    // The quoted field spans two physical lines; the record ends at the closing quote.
    const text = 'col\n"line one\nline two"\n';
    const table = Delimited.delimitedTableOf(text, ',')!;

    expect(table.header).toEqual(['col']);
    expect(table.rows[0]).toEqual(['line one\nline two']);
  });

  test('"" inside a quoted field encodes a single literal quote', () => {
    const text = 'note\n"say ""hello"""\n';
    const table = Delimited.delimitedTableOf(text, ',')!;

    expect(table.header).toEqual(['note']);
    expect(table.rows[0]).toEqual(['say "hello"']);
  });

  test('CRLF line endings end records the same way LF does', () => {
    const text = 'x,y\r\n1,2\r\n3,4\r\n';
    const table = Delimited.delimitedTableOf(text, ',')!;

    expect(table.header).toEqual(['x', 'y']);
    expect(table.rows).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  test('a short row is padded with empty cells to the header width', () => {
    const text = 'a,b,c\n1,2\n';
    const table = Delimited.delimitedTableOf(text, ',')!;

    expect(table.rows[0]).toEqual(['1', '2', '']);
  });

  test('a long row keeps its extra cells and the header gains empty names', () => {
    const text = 'a,b\n1,2,3,4\n';
    const table = Delimited.delimitedTableOf(text, ',')!;

    expect(table.header).toEqual(['a', 'b', '', '']);
    expect(table.rows[0]).toEqual(['1', '2', '3', '4']);
    expect(table.align).toEqual(['left', 'left', 'left', 'left']);
  });

  test('an unterminated quoted field returns null', () => {
    expect(Delimited.delimitedTableOf('a,b\n"unterminated', ',')).toBeNull();
    expect(Delimited.delimitedTableOf('"still open', ',')).toBeNull();
  });

  test('an empty file returns null', () => {
    expect(Delimited.delimitedTableOf('', ',')).toBeNull();
  });

  test('a quote in the middle of an unquoted field is treated as a literal character', () => {
    // RFC 4180 forbids this, but real files contain it; the parser preserves the data.
    const text = 'col\na"b\n';
    const table = Delimited.delimitedTableOf(text, ',')!;

    expect(table.rows[0]).toEqual(['a"b']);
  });

  test('a character after a closing quote keeps the quote and the character, both literal', () => {
    // "abc"x: the closing quote is not a true close because x follows without a separator or
    // newline. Both the quote and x are kept, by the same rule as a mid-field quote in an
    // unquoted field: sidepad shows what is in the file.
    const text = 'col\n"abc"x\n';
    const table = Delimited.delimitedTableOf(text, ',')!;

    expect(table.rows[0]).toEqual(['abc"x']);
  });

  test('a CRLF inside a quoted field is data, not a record end', () => {
    // RFC 4180 section 2.6: a CRLF inside a quoted field is part of the field value.
    const text = 'col\n"line one\r\nline two"\n';
    const table = Delimited.delimitedTableOf(text, ',')!;

    expect(table.header).toEqual(['col']);
    expect(table.rows[0]).toEqual(['line one\r\nline two']);
  });

  test('two header expansions leave every earlier row padded to the final width', () => {
    // Row 1 expands the header from 2 to 3; row 2 expands it to 4.
    // Row 1 must end up 4 wide, not 3.
    const text = 'a,b\n1,2,3\n4,5,6,7\n';
    const table = Delimited.delimitedTableOf(text, ',')!;

    expect(table.header).toEqual(['a', 'b', '', '']);
    expect(table.rows[0]).toEqual(['1', '2', '3', '']);
    expect(table.rows[1]).toEqual(['4', '5', '6', '7']);
    expect(table.align).toEqual(['left', 'left', 'left', 'left']);
  });

  test('a TSV file uses tab as the separator', () => {
    const text = 'name\tvalue\nalice\t42\n';
    const table = Delimited.delimitedTableOf(text, '\t')!;

    expect(table.header).toEqual(['name', 'value']);
    expect(table.rows[0]).toEqual(['alice', '42']);
  });

  test('a file with no trailing newline flushes the last record', () => {
    const text = 'a,b\n1,2';
    const table = Delimited.delimitedTableOf(text, ',')!;

    expect(table.header).toEqual(['a', 'b']);
    expect(table.rows[0]).toEqual(['1', '2']);
  });
});
