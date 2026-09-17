import MarkdownBlocks from '../markdown-blocks';

/**
 * The least scroll, in blocks, that shows a block whole above the bar: down while its end is
 * hidden, up to it when it is above the window.
 *
 * @returns the new first block shown
 */
export function revealedBlockTopOf(
  rowsOf: MarkdownBlocks.RowsOfBlock,
  blockTop: number,
  index: number,
  shownRows: number,
): number {
  let top = blockTop;

  while (top < index && MarkdownBlocks.rowOfBlock(rowsOf, top, index) + rowsOf(index) > shownRows) {
    top += 1;
  }

  return Math.min(top, index);
}
