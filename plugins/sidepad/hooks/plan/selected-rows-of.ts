import type LineRange from '../line-range';
import type MarkdownBlocks from '../markdown-blocks';
import type PageLayout from '../page-layout';

/** The page rows a run of blocks covers, the blank row between two of them included. */
function rowsOf(page: PageLayout.PageLayout, low: number, high: number): { start: number; end: number } | null {
  const first = page.blocks[low];
  const last = page.blocks[high];

  if (!first || !last) {
    return null;
  }

  return { start: first.firstRow, end: Math.max(first.firstRow, last.firstRow + last.layout.rows - 1) };
}

/**
 * The page rows the formatted page draws as selected: the blocks under a drag while one is held,
 * else the blocks the settled selection holds whole.
 *
 * @param blocks the file's blocks, which the selection names by source lines
 * @param dragged the blocks a press is over now, null when none is held
 * @returns the rows, both ends included, or null when nothing is selected
 */
export function selectedRowsOf(
  page: PageLayout.PageLayout,
  blocks: readonly MarkdownBlocks.MarkdownBlock[],
  selection: LineRange.LineRange | null,
  dragged: { anchor: number; head: number } | null,
): { start: number; end: number } | null {
  if (dragged) {
    return rowsOf(page, Math.min(dragged.anchor, dragged.head), Math.max(dragged.anchor, dragged.head));
  }

  if (selection === null) {
    return null;
  }

  const holds = (block: MarkdownBlocks.MarkdownBlock) => block.start >= selection.start && block.end <= selection.end;
  const low = blocks.findIndex(holds);

  return low < 0 ? null : rowsOf(page, low, blocks.findLastIndex(holds));
}
