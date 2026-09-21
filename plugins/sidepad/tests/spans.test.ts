import { describe, expect, test, tier } from 'claude-code/testing';

import MarkdownBlocks from '../hooks/markdown-blocks';
import Spans from '../hooks/spans';

tier('user');

/** Parse a string as inline content and return its inline token. */
function inline(src: string) {
  return MarkdownBlocks.parser.parseInline(src, {})[0]!;
}

describe('spans', () => {
  test('plain text is one span with no extra attributes', () => {
    expect(Spans.spansOf(inline('hello world'))).toEqual([{ text: 'hello world' }]);
  });

  test('bold text carries the bold attribute', () => {
    expect(Spans.spansOf(inline('**bold**'))).toEqual([{ text: 'bold', bold: true }]);
  });

  test('italic text carries the italic attribute', () => {
    expect(Spans.spansOf(inline('_italic_'))).toEqual([{ text: 'italic', italic: true }]);
  });

  test('bold inside italic gives both attributes on the same span', () => {
    expect(Spans.spansOf(inline('_**both**_'))).toEqual([{ text: 'both', bold: true, italic: true }]);
  });

  test('struck text carries strikethrough, and the text after it does not', () => {
    expect(Spans.spansOf(inline('~~gone~~ kept'))).toEqual([{ text: 'gone', strikethrough: true }, { text: ' kept' }]);
  });

  test('inline code is one span with isCode', () => {
    expect(Spans.spansOf(inline('`code`'))).toEqual([{ text: 'code', isCode: true }]);
  });

  test('an https link carries its href on its text, and its target is not written after it', () => {
    expect(Spans.spansOf(inline('see [the **label**](https://example.com/doc) here'))).toEqual([
      { text: 'see ' },
      { text: 'the ', href: 'https://example.com/doc' },
      { text: 'label', bold: true, href: 'https://example.com/doc' },
      { text: ' here' },
    ]);
  });

  test('a link a Link cannot carry emits its text then its target in accent', () => {
    expect(Spans.spansOf(inline('[label](./other.md)'))).toEqual([
      { text: 'label' },
      { text: ' (./other.md)', tone: 'link' },
    ]);
    expect(Spans.spansOf(inline('[label](http://example.com)'))).toEqual([
      { text: 'label' },
      { text: ' (http://example.com)', tone: 'link' },
    ]);
  });

  test('an image emits its alt then its src in accent', () => {
    expect(Spans.spansOf(inline('![alt text](./img.png)'))).toEqual([
      { text: 'alt text' },
      { text: ' (./img.png)', tone: 'link' },
    ]);
  });

  test('softbreak is a single space (CommonMark)', () => {
    expect(Spans.spansOf(inline('a\nb'))).toEqual([{ text: 'a' }, { text: ' ' }, { text: 'b' }]);
  });

  test('hardbreak emits a newline span', () => {
    expect(Spans.spansOf(inline('a  \nb'))).toEqual([{ text: 'a' }, { text: '\n' }, { text: 'b' }]);
  });

  test('inline HTML passes through as its source text', () => {
    expect(Spans.spansOf(inline('a<br>b'))).toEqual([{ text: 'a' }, { text: '<br>' }, { text: 'b' }]);
  });

  test('an empty inline token gives an empty span list', () => {
    expect(Spans.spansOf(inline(''))).toEqual([]);
  });
});

describe('linkHrefOf', () => {
  test('an https or localhost target spelled as the URL parser spells it is taken as it is', () => {
    for (const href of [
      'https://example.com/',
      'https://docs.example.com/a/b-c_d.e~f?q=1&r=two#part',
      'https://example.com/%E2%9C%93',
      'http://localhost/',
      'http://localhost:3000/app',
    ]) {
      expect(Spans.linkHrefOf(href), href).toBe(href);
    }
  });

  test('a bare origin gains the slash the URL parser adds', () => {
    expect(Spans.linkHrefOf('https://example.com')).toBe('https://example.com/');
    expect(Spans.linkHrefOf('https://example.com?q=1')).toBe('https://example.com/?q=1');
    expect(Spans.linkHrefOf('http://localhost:8080')).toBe('http://localhost:8080/');
  });

  test('a target the engine would refuse, or would spell otherwise, stays text', () => {
    for (const target of [
      '',
      './other.md',
      '/abs/path.md',
      'mailto:carol@example.com',
      'http://example.com/',
      'https://carol@example.com/',
      'https://example.com@evil.com/',
      'https://example.com:443/',
      'https://example.com:8443/',
      'http://localhost:80/',
      'http://localhost:070/',
      'http://localhost:70000/',
      'https://Example.com/',
      'https://example.com/a b',
      'https://example.com/a@b',
      'https://example.com/a/../b',
      'https://example.com/./b',
      'https://example.com/\u2713',
      // The URL parser reads a host ending in a number as IPv4 and respells or refuses it.
      'https://127.1/',
      'https://0x7f.0.0.1/',
      'https://01.2.3.4/',
      'https://example.1/',
      'https://999.1.1.1/',
      // A punycode label the parser may refuse; checking one needs the IDNA tables.
      'https://xn--a.com/',
      // Dot pieces spelled encoded, which the parser walks as it does `.` and `..`.
      'https://example.com/%2e%2e/a',
      'https://example.com/a/%2E/b',
      `https://example.com/${'a'.repeat(2048)}`,
    ]) {
      expect(Spans.linkHrefOf(target), target).toBeNull();
    }
  });
});

describe('wrappedRowsOf', () => {
  test('wraps words at the column boundary', () => {
    const spans = [{ text: 'hello world' }];
    expect(Spans.wrappedRowsOf(spans, 8, { first: 0, rest: 0 })).toEqual([
      { spans: [{ text: 'hello' }] },
      { spans: [{ text: 'world' }] },
    ]);
  });

  test('cuts a word that exceeds the available width', () => {
    const spans = [{ text: 'abcdef' }];
    expect(Spans.wrappedRowsOf(spans, 4, { first: 0, rest: 0 })).toEqual([
      { spans: [{ text: 'abcd' }] },
      { spans: [{ text: 'ef' }] },
    ]);
  });

  test('indent.first reduces the first row room', () => {
    // columns=6, indent.first=2: first room=4; 'one' fits, adding space hits 4, then 'two' overflows
    const spans = [{ text: 'one two' }];
    expect(Spans.wrappedRowsOf(spans, 6, { first: 2, rest: 0 })).toEqual([
      { spans: [{ text: 'one' }] },
      { spans: [{ text: 'two' }] },
    ]);
  });

  test('indent.rest gives a hanging indent for wrapped rows', () => {
    // columns=10, first room=10, rest room=6; 'one two' fits on row 0, 'three' on row 1
    const spans = [{ text: 'one two three' }];
    expect(Spans.wrappedRowsOf(spans, 10, { first: 0, rest: 4 })).toEqual([
      { spans: [{ text: 'one' }, { text: ' ' }, { text: 'two' }] },
      { spans: [{ text: 'three' }] },
    ]);
  });

  test('a hard-break span ends the row, producing an empty row when back-to-back', () => {
    const spans = [{ text: 'a' }, { text: '\n' }, { text: '\n' }, { text: 'b' }];
    expect(Spans.wrappedRowsOf(spans, 20, { first: 0, rest: 0 })).toEqual([
      { spans: [{ text: 'a' }] },
      { spans: [] },
      { spans: [{ text: 'b' }] },
    ]);
  });

  test('span attributes survive a word-wrap break', () => {
    const spans = [{ text: 'hello world', bold: true }] satisfies { text: string; bold?: true }[];
    expect(Spans.wrappedRowsOf(spans, 8, { first: 0, rest: 0 })).toEqual([
      { spans: [{ text: 'hello', bold: true }] },
      { spans: [{ text: 'world', bold: true }] },
    ]);
  });

  test('columns of 1 puts one code point per row', () => {
    const spans = [{ text: 'abc' }];
    expect(Spans.wrappedRowsOf(spans, 1, { first: 0, rest: 0 })).toEqual([
      { spans: [{ text: 'a' }] },
      { spans: [{ text: 'b' }] },
      { spans: [{ text: 'c' }] },
    ]);
  });

  test('columns no wider than indent.rest falls back to one code point per rest row', () => {
    // columns=3, first room=3, rest room=max(1,3-3)=1; 'ab' fills row 0, then one char per row
    const spans = [{ text: 'ab cd' }];
    expect(Spans.wrappedRowsOf(spans, 3, { first: 0, rest: 3 })).toEqual([
      { spans: [{ text: 'ab' }] },
      { spans: [{ text: 'c' }] },
      { spans: [{ text: 'd' }] },
    ]);
  });

  test('a word whose width exactly equals the remaining room stays on the current row', () => {
    // 'a'(1) + ' '(1) + 'hey'(3) = 5 = columns; 'hey' must land on row 0, not wrap to row 1.
    // If the fits condition were < instead of <=, 'hey' would be moved to the next row.
    const spans = [{ text: 'a hey' }];
    expect(Spans.wrappedRowsOf(spans, 5, { first: 0, rest: 0 })).toEqual([
      { spans: [{ text: 'a' }, { text: ' ' }, { text: 'hey' }] },
    ]);
  });

  test('a word exactly filling indent.rest room stays on the rest row', () => {
    // columns=7, first room=7, rest room=5; 'b'(1)+' '(1)+'hey'(3)=5 exactly fills the rest row.
    // If the fits condition were < instead of <=, 'hey' would be moved to a third row.
    const spans = [{ text: 'long' }, { text: '\n' }, { text: 'b hey' }];
    expect(Spans.wrappedRowsOf(spans, 7, { first: 0, rest: 2 })).toEqual([
      { spans: [{ text: 'long' }] },
      { spans: [{ text: 'b' }, { text: ' ' }, { text: 'hey' }] },
    ]);
  });
});
