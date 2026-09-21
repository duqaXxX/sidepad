import { describe, expect, test, tier } from 'claude-code/testing';

import MarkdownBlocks from '../hooks/markdown-blocks';
import PageLayout from '../hooks/page-layout';
import { CWD, SAMPLE_MARKDOWN, SAMPLE_PAGE_WITH_IMAGE } from './fixtures';

tier('user');

const COLUMNS = 79;
const LINES = SAMPLE_MARKDOWN.split('\n');
const BLOCKS = MarkdownBlocks.markdownBlocksOf(LINES);

/** The text of every composed row a run of segments holds, in the order drawn. */
const textOf = (segments: readonly PageLayout.PlacedSegment[]) =>
  segments.flatMap((placed) =>
    placed.segment.kind === 'rows' ? placed.segment.rows.map((row) => row.spans.map((span) => span.text).join('')) : [],
  );

describe('page-layout', () => {
  const page = PageLayout.pageLayoutOf(BLOCKS, LINES, COLUMNS);

  test('every block is placed in turn, a blank row between two of them and none after the last', () => {
    // heading 1, paragraph 1, table 5, list 2, fence 3, with four blank rows between them.
    expect(page.blocks.map((placed) => [placed.firstRow, placed.layout.rows])).toEqual([
      [0, 1],
      [2, 1],
      [4, 5],
      [10, 2],
      [13, 3],
    ]);
    expect(page.rows).toBe(16);
  });

  test('a row names the block drawn on it, the blank row under a block counting as that block', () => {
    expect(PageLayout.blockAtRow(page, 0)).toBe(0);
    expect(PageLayout.blockAtRow(page, 1), 'the blank row under the heading').toBe(0);
    expect(PageLayout.blockAtRow(page, 7), "the table's body row").toBe(2);
    expect(PageLayout.blockAtRow(page, 99), 'past the page: the last block').toBe(4);
    expect(PageLayout.blockAtRow(page, -1), 'above the page: the first').toBe(0);
  });

  test('a window holds every row it covers, blank rows included, the fence a segment of its own', () => {
    const segments = PageLayout.pageSegmentsOf(page, 0, page.rows);

    expect(segments.map((placed) => [placed.segment.kind, placed.firstRow, placed.rows])).toEqual([
      ['rows', 0, 13],
      ['code', 13, 3],
    ]);
    expect(textOf(segments)).toEqual([
      'Notes',
      '',
      'A paragraph on two lines.',
      '',
      '┌───┬───┐',
      '│ a │ b │',
      '├───┼───┤',
      '│ 1 │ 2 │',
      '└───┴───┘',
      '',
      '• one',
      '• two',
      '',
    ]);
  });

  test('a window cutting through a block draws only its rows, a fence cut to its own lines', () => {
    const segments = PageLayout.pageSegmentsOf(page, 6, 9);

    expect(segments.map((placed) => [placed.segment.kind, placed.firstRow, placed.rows])).toEqual([
      ['rows', 6, 7],
      ['code', 13, 2],
    ]);
    expect(segments[1]?.segment.kind === 'code' && segments[1].segment.source).toBe('const a = 1;\n');
    expect(textOf(segments), 'the rows the window covers, the blank row between two blocks too').toEqual([
      '├───┼───┤',
      '│ 1 │ 2 │',
      '└───┴───┘',
      '',
      '• one',
      '• two',
      '',
    ]);
  });

  test('a block too long for one element places its note, and takes one row', () => {
    const lines = ['# Title', '', 'z'.repeat(12_000)];
    const long = PageLayout.pageLayoutOf(MarkdownBlocks.markdownBlocksOf(lines), lines, COLUMNS);

    expect(long.blocks.map((placed) => placed.layout.rows)).toEqual([1, 1]);
    expect(PageLayout.pageSegmentsOf(long, 0, long.rows).map((placed) => placed.segment.kind)).toEqual([
      'rows',
      'note',
    ]);
  });

  test('a block with nothing to draw still takes a row, so a click reaches it and no gap closes the page', () => {
    const lines = ['# A', '', '```ts', '```'];
    const empty = PageLayout.pageLayoutOf(MarkdownBlocks.markdownBlocksOf(lines), lines, COLUMNS);

    expect(empty.blocks.map((placed) => [placed.firstRow, placed.layout.rows])).toEqual([
      [0, 1],
      [2, 1],
    ]);
    expect(empty.rows, 'the page ends on the empty fence, not on a gap after it').toBe(3);
    expect(PageLayout.blockAtRow(empty, 2)).toBe(1);
  });

  test('a picture cuts the page into runs, and each run keeps its number wherever the window sits', () => {
    const lines = SAMPLE_PAGE_WITH_IMAGE.split('\n');
    const images = { './logo.png': { path: `${CWD}/docs/logo.png`, width: 320, height: 40, generation: 7 } };
    const withImage = PageLayout.pageLayoutOf(MarkdownBlocks.markdownBlocksOf(lines), lines, COLUMNS, images);
    const shape = (from: number, count: number) =>
      PageLayout.pageSegmentsOf(withImage, from, count).map((placed) => [
        placed.segment.kind,
        placed.firstRow,
        placed.run,
      ]);

    // Rows 0-3 before the picture, the picture on 4-8, and rows 9-12 after it.
    expect(shape(0, withImage.rows)).toEqual([
      ['rows', 0, 0],
      ['image', 4, 0],
      ['rows', 9, 1],
    ]);
    expect(shape(9, 4), 'the picture scrolled out of view leaves the run after it its own number').toEqual([
      ['rows', 9, 1],
    ]);
  });
});
