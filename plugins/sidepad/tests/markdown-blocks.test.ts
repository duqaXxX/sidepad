import { describe, expect, test, tier } from 'claude-code/testing';

import MarkdownBlocks from '../hooks/markdown-blocks';
import { SAMPLE_MARKDOWN, SAMPLE_PAGE_WITH_IMAGE } from './fixtures';

tier('user');

describe('markdown-blocks', () => {
  const blocks = MarkdownBlocks.markdownBlocksOf(SAMPLE_MARKDOWN.split('\n'));

  test('each block keeps its kind and its source lines; a fence keeps its blank line', () => {
    expect(blocks).toEqual([
      { kind: 'heading', start: 1, end: 1 },
      { kind: 'paragraph', start: 3, end: 4 },
      { kind: 'table', start: 6, end: 8 },
      { kind: 'list', start: 10, end: 11 },
      { kind: 'code', start: 13, end: 17 },
    ]);
  });

  test('an unclosed fence runs to the end; a table right after a paragraph is its own block', () => {
    expect(MarkdownBlocks.markdownBlocksOf(['```', 'a', 'b'])).toEqual([{ kind: 'code', start: 1, end: 3 }]);
    expect(MarkdownBlocks.markdownBlocksOf(['text', '| a |', '|---|', '| 1 |'])).toEqual([
      { kind: 'paragraph', start: 1, end: 1 },
      { kind: 'table', start: 2, end: 4 },
    ]);
    expect(MarkdownBlocks.markdownBlocksOf(['text', '| a |']), 'no delimiter row, no table').toEqual([
      { kind: 'paragraph', start: 1, end: 2 },
    ]);
  });

  test('CommonMark and GFM blocks are cut where they end: setext, HTML, a lazy list line', () => {
    expect(
      MarkdownBlocks.markdownBlocksOf([
        'Title', //                    1
        '=====', //                    2
        '', //                         3
        '<details>', //                4
        '<summary>More</summary>', //  5
        '</details>', //               6
        '', //                         7
        '- an item', //                8
        'continued lazily', //         9
        '', //                         10
        '> a quote', //                11
        'continued lazily', //         12
      ]),
    ).toEqual([
      { kind: 'heading', start: 1, end: 2 },
      { kind: 'html', start: 4, end: 6 },
      { kind: 'list', start: 8, end: 9 },
      { kind: 'quote', start: 11, end: 12 },
    ]);
  });

  test('blank lines between blocks, and a CRLF file, keep every block on its own lines', () => {
    expect(MarkdownBlocks.markdownBlocksOf(['', '', '# A', '', '', '', 'b\r', 'c\r', '\r'])).toEqual([
      { kind: 'heading', start: 3, end: 3 },
      { kind: 'paragraph', start: 7, end: 8 },
    ]);
  });

  test('a click on a source line selects its block, or the blank line alone', () => {
    expect(MarkdownBlocks.markdownBlockAt(blocks, 7)).toEqual({ start: 6, end: 8 });
    expect(MarkdownBlocks.markdownBlockAt(blocks, 9)).toEqual({ start: 9, end: 9 });
  });

  test('a paragraph naming one picture is told from one that names it beside words', () => {
    expect(MarkdownBlocks.loneImageOf(['![the logo](./logo.png)'])).toEqual({ src: './logo.png', alt: 'the logo' });
    expect(MarkdownBlocks.loneImageOf(['![](./logo.png)']), 'a picture with no alt still counts').toEqual({
      src: './logo.png',
      alt: '',
    });
    expect(MarkdownBlocks.loneImageOf(['See ![the logo](./logo.png)'])).toBeNull();
    expect(MarkdownBlocks.loneImageOf(['![no target]()'])).toBeNull();
    expect(MarkdownBlocks.loneImageOf(['# A heading'])).toBeNull();
  });

  test("every target a page's own paragraphs name, each once and in the order written", () => {
    expect(MarkdownBlocks.imageTargetsOf(SAMPLE_PAGE_WITH_IMAGE.split('\n'))).toEqual(['./logo.png', './gone.png']);
    expect(
      MarkdownBlocks.imageTargetsOf(['![a](./one.png)', '', '![b](./one.png)', '', 'text ![c](./two.png)']),
      'a target named twice is read once, and one inside a sentence is not read at all',
    ).toEqual(['./one.png']);
  });
});
