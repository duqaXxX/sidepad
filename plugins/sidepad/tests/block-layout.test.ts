import { describe, expect, test, tier } from 'claude-code/testing';

import BlockLayout from '../hooks/block-layout';
import MarkdownBlocks from '../hooks/markdown-blocks';
import Names from '../hooks/names';
import { CWD, SAMPLE_MARKDOWN } from './fixtures';

tier('user');

const COLUMNS = 40;
const LINES = SAMPLE_MARKDOWN.split('\n');
const BLOCKS = MarkdownBlocks.markdownBlocksOf(LINES);

// BLOCKS from SAMPLE_MARKDOWN, 0-indexed: heading(0), paragraph(1), table(2), list(3), code(4)

describe('block-layout', () => {
  test('a heading wraps its text bold at the page width, no # characters', () => {
    // Block 0: `# Notes`, 1 source line.
    const layout = BlockLayout.blockLayoutOf(BLOCKS[0]!, LINES, COLUMNS);
    const seg = layout.segments[0];
    const rows = seg?.kind === 'rows' ? seg.rows : [];

    // "Notes" fits on one row; every span is bold.
    expect(rows).toHaveLength(1);
    expect(rows[0]!.spans.every((span) => span.bold)).toBe(true);
    expect(rows[0]!.spans.map((s) => s.text).join('')).toBe('Notes');
    expect(layout.rows).toBe(1);
  });

  test('a paragraph wraps its inline spans at the page width', () => {
    // Block 1: `A paragraph` / `on two lines.` — a soft break, flowed to one line by spansOf.
    const layout = BlockLayout.blockLayoutOf(BLOCKS[1]!, LINES, COLUMNS);
    const seg = layout.segments[0];
    const rows = seg?.kind === 'rows' ? seg.rows : [];

    // "A paragraph on two lines." is 25 chars, fits on one row at width 40.
    expect(rows).toHaveLength(1);
    expect(rows[0]!.spans.map((s) => s.text).join('')).toBe('A paragraph on two lines.');
    expect(layout.rows).toBe(1);
  });

  test('a table maps to rows: one per drawn row, the header row bold', () => {
    // Block 2: the two-column table (lines 6-8).
    const layout = BlockLayout.blockLayoutOf(BLOCKS[2]!, LINES, COLUMNS);
    const seg = layout.segments[0];
    const rows = seg?.kind === 'rows' ? seg.rows : [];

    // top rule + header + middle rule + one body row + bottom rule = 5 rows
    expect(rows).toHaveLength(5);
    // Header row (index 1) has bold spans; rules and body do not.
    expect(rows[1]!.spans.every((s) => s.bold)).toBe(true);
    expect(rows[0]!.spans.every((s) => !s.bold)).toBe(true);
    expect(layout.rows).toBe(5);
  });

  test('a list emits one row per item with a bullet marker prepended', () => {
    // Block 3: `- one` / `- two`, a two-item bullet list.
    const layout = BlockLayout.blockLayoutOf(BLOCKS[3]!, LINES, COLUMNS);
    const seg = layout.segments[0];
    const rows = seg?.kind === 'rows' ? seg.rows : [];

    // Two items, one row each.
    expect(rows).toHaveLength(2);
    expect(rows[0]!.spans[0]!.text).toBe(`${Names.BULLET_MARKER} `);
    expect(rows[1]!.spans[0]!.text).toBe(`${Names.BULLET_MARKER} `);
    expect(layout.rows).toBe(2);
  });

  test("a task item's brackets become a box joined to its marker, its text hanging past the box", () => {
    const lines = [
      '- [ ] an open task whose text runs past the width',
      '- [x] a done task',
      '- [X] **bold** done',
      '- plain item',
      '- **[ ]** not a task',
      '- [ ]',
      '- \\[ ] escaped',
    ];
    const layout = BlockLayout.blockLayoutOf(MarkdownBlocks.markdownBlocksOf(lines)[0]!, lines, 24);
    const seg = layout.segments[0];
    const texts = (seg?.kind === 'rows' ? seg.rows : []).map((row) => row.spans.map((span) => span.text).join(''));
    const open = `${Names.BULLET_MARKER} ${Names.TASK_OPEN_MARKER} `;
    const done = `${Names.BULLET_MARKER} ${Names.TASK_DONE_MARKER} `;

    expect(texts).toEqual([
      `${open}an open task whose`,
      '    text runs past the',
      '    width',
      `${done}a done task`,
      `${done}bold done`,
      `${Names.BULLET_MARKER} plain item`,
      `${Names.BULLET_MARKER} [ ] not a task`,
      `${Names.BULLET_MARKER} [ ]`,
      `${Names.BULLET_MARKER} [ ] escaped`,
    ]);
  });

  test("a task item's later paragraph hangs past its box, and an ordered item takes one too", () => {
    const lines = ['1. [x] first', '', '   more of it', '2. second'];
    const layout = BlockLayout.blockLayoutOf(MarkdownBlocks.markdownBlocksOf(lines)[0]!, lines, 40);
    const seg = layout.segments[0];
    const texts = (seg?.kind === 'rows' ? seg.rows : []).map((row) => row.spans.map((span) => span.text).join(''));

    expect(texts).toEqual([`1. ${Names.TASK_DONE_MARKER} first`, '     more of it', '2. second']);
  });

  test('a code block is a single code segment with its source, language and line count', () => {
    // Block 4: ```ts / const a = 1; / (blank) / const b = 2; / ```, language "ts", 3 source lines.
    const layout = BlockLayout.blockLayoutOf(BLOCKS[4]!, LINES, COLUMNS);
    const seg = layout.segments[0];

    expect(seg).toMatchObject({ kind: 'code', language: 'ts', rows: 3 });
    expect(seg?.kind === 'code' ? seg.source : '').toBe('const a = 1;\n\nconst b = 2;');
    expect(layout.rows).toBe(3);
  });

  test('a horizontal rule is one row of the rule character at the page width', () => {
    const block: MarkdownBlocks.MarkdownBlock = { kind: 'rule', start: 1, end: 1 };
    const layout = BlockLayout.blockLayoutOf(block, ['---'], COLUMNS);
    const seg = layout.segments[0];
    const rows = seg?.kind === 'rows' ? seg.rows : [];

    expect(rows).toHaveLength(1);
    expect(rows[0]!.spans[0]!.text).toBe('─'.repeat(COLUMNS));
    expect(rows[0]!.spans[0]!.tone).toBe('rule');
    expect(layout.rows).toBe(1);
  });

  test('a blockquote prefixes each content row with the quote marker', () => {
    const block: MarkdownBlocks.MarkdownBlock = { kind: 'quote', start: 1, end: 1 };
    const layout = BlockLayout.blockLayoutOf(block, ['> A quoted passage.'], COLUMNS);
    const seg = layout.segments[0];
    const rows = seg?.kind === 'rows' ? seg.rows : [];

    // "A quoted passage." is 18 chars, fits on one row at width 40 - 2 = 38.
    expect(rows).toHaveLength(1);
    expect(rows[0]!.spans[0]!.text).toBe(Names.QUOTE_MARKER);
    expect(rows[0]!.spans[0]!.tone).toBe('rule');
    expect(layout.rows).toBe(1);
  });

  test('an HTML block renders each source line as a dim row', () => {
    const block: MarkdownBlocks.MarkdownBlock = { kind: 'html', start: 1, end: 3 };
    const layout = BlockLayout.blockLayoutOf(block, ['<details>', '<summary>Info</summary>', '</details>'], COLUMNS);
    const seg = layout.segments[0];
    const rows = seg?.kind === 'rows' ? seg.rows : [];

    // Three non-empty lines, each shorter than 40 chars: three rows.
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.spans.every((s) => s.dim))).toBe(true);
    expect(layout.rows).toBe(3);
  });

  test('a block whose source exceeds MAX_ELEMENT_CHARS becomes a single note segment', () => {
    const block: MarkdownBlocks.MarkdownBlock = { kind: 'paragraph', start: 1, end: 1 };
    const layout = BlockLayout.blockLayoutOf(block, ['a'.repeat(10_001)], COLUMNS);

    expect(layout.segments).toHaveLength(1);
    expect(layout.segments[0]).toMatchObject({ kind: 'note', text: Names.BLOCK_TOO_LONG_NOTE });
    expect(layout.rows).toBe(1);
  });

  test('a paragraph naming a picture the page holds lays out as a box, and names the file', () => {
    const lines = ['![the logo](./logo.png)', '', '![](./logo.png)'];
    const blocks = MarkdownBlocks.markdownBlocksOf(lines);
    const images = { './logo.png': { path: `${CWD}/docs/logo.png`, width: 320, height: 40, generation: 7 } };

    // A 320 by 40 picture at 40 columns: 40 cells wide, and 3 rows tall once a cell counts double.
    expect(BlockLayout.blockLayoutOf(blocks[0]!, lines, COLUMNS, images)).toEqual({
      segments: [{ kind: 'image', path: `${CWD}/docs/logo.png`, alt: 'the logo', generation: 7, columns: 40, rows: 3 }],
      rows: 3,
    });
    expect(
      BlockLayout.blockLayoutOf(blocks[1]!, lines, COLUMNS, images).segments[0],
      'a picture with no alt takes the name of the file it draws',
    ).toMatchObject({ alt: 'logo.png' });
  });

  test('a paragraph whose picture the page does not hold keeps its alt and its target as text', () => {
    const lines = ['![missing](./gone.png)'];
    const blocks = MarkdownBlocks.markdownBlocksOf(lines);
    const layout = BlockLayout.blockLayoutOf(blocks[0]!, lines, COLUMNS);
    const seg = layout.segments[0];

    expect(seg?.kind).toBe('rows');
    expect(seg?.kind === 'rows' && seg.rows[0]?.spans.map((span) => span.text)).toEqual([
      'missing',
      ' ',
      '(./gone.png)',
    ]);
  });
});
