import { describe, expect, test, tier } from 'claude-code/testing';

import MarkdownBlocks from '../hooks/markdown-blocks';
import Names from '../hooks/names';
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

  test('inline code is one span with isCode', () => {
    expect(Spans.spansOf(inline('`code`'))).toEqual([{ text: 'code', isCode: true }]);
  });

  test('a link emits its text spans then its url in accent', () => {
    expect(Spans.spansOf(inline('[label](https://example.com)'))).toEqual([
      { text: 'label' },
      { text: ' (https://example.com)', color: Names.ACCENT },
    ]);
  });

  test('an image emits its alt then its src in accent', () => {
    expect(Spans.spansOf(inline('![alt text](./img.png)'))).toEqual([
      { text: 'alt text' },
      { text: ' (./img.png)', color: Names.ACCENT },
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
