import BlockLayout from '../block-layout';
import Limits from '../limits';
import type MarkdownBlocks from '../markdown-blocks';
import type { PageLayout, PlacedBlock } from './page-layout';

/**
 * The layout last built for a block list, kept because the page is a pure function of the blocks,
 * the file's lines and the width, while a drawing, a scroll and every pointer event ask for it
 * again. Laying out a file of 2,200 lines costs about 2 ms (measured 2026-09-20), so a frame that
 * asked four times would pay it four times. The key is the block list, which a reload replaces, and
 * the entry goes when nothing holds it.
 */
const CACHE = new WeakMap<
  readonly MarkdownBlocks.MarkdownBlock[],
  { lines: readonly string[]; columns: number; page: PageLayout }
>();

/** What an unmeasured block draws: one blank row, so a page of them is self-consistent. */
const UNMEASURED_BLOCK: BlockLayout.BlockLayout = { segments: [{ kind: 'rows', rows: [{ spans: [] }] }], rows: 1 };

/**
 * A page for a block list nobody has reported a width for: one row a block, placed without laying
 * anything out. A drawing lays the page out for real and reads the row shown as the block drawn on
 * it, so these rows only have to name the same blocks the real page names.
 *
 * Laying a file out at a guessed width costs what the real layout costs and is thrown away by the
 * first drawing; at one column a file of a few MB wraps to a row per character.
 *
 * @returns the placed blocks and the page's rows
 */
export function unmeasuredPageOf(blocks: readonly MarkdownBlocks.MarkdownBlock[]): PageLayout {
  const step = 1 + Limits.BLOCK_GAP_ROWS;

  return {
    blocks: blocks.map((_, at) => ({ firstRow: at * step, layout: UNMEASURED_BLOCK })),
    rows: Math.max(0, blocks.length * step - Limits.BLOCK_GAP_ROWS),
  };
}

/** Every block laid out and placed one after the other, a blank row between two of them. */
function laidOut(
  blocks: readonly MarkdownBlocks.MarkdownBlock[],
  lines: readonly string[],
  columns: number,
): PageLayout {
  const placed: PlacedBlock[] = [];
  let row = 0;

  for (const block of blocks) {
    const layout = BlockLayout.blockLayoutOf(block, lines, columns);

    placed.push({ firstRow: row, layout });
    row += layout.rows + Limits.BLOCK_GAP_ROWS;
  }

  return { blocks: placed, rows: Math.max(0, row - Limits.BLOCK_GAP_ROWS) };
}

/**
 * Every block of a Markdown file laid out at a page's width, one after the other with a blank row
 * between two of them. The rows a block takes are its layout's, so the page's height is the hooks'
 * to know and no Client has to report it. The result is kept, so asking again costs nothing.
 *
 * @param blocks the file's blocks, in order
 * @param lines the file's lines, 0-indexed
 * @param columns the page's width in cells
 * @returns the placed blocks and the page's rows
 */
export function pageLayoutOf(
  blocks: readonly MarkdownBlocks.MarkdownBlock[],
  lines: readonly string[],
  columns: number,
): PageLayout {
  const held = CACHE.get(blocks);

  if (held && held.lines === lines && held.columns === columns) {
    return held.page;
  }

  const page = laidOut(blocks, lines, columns);

  CACHE.set(blocks, { lines, columns, page });

  return page;
}

/**
 * The block drawn at a page row; the blank row under a block counts as that block's, a row above the
 * page as the first block and one past its end as the last.
 *
 * @returns the block's index, 0 for a file with no block
 */
export function blockAtRow(page: PageLayout, row: number): number {
  for (let at = 0; at < page.blocks.length; at += 1) {
    const next = page.blocks[at + 1];

    if (next === undefined || row < next.firstRow) {
      return at;
    }
  }

  return 0;
}
