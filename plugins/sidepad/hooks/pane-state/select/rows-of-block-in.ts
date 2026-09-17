import type MarkdownBlocks from '../../markdown-blocks';
import type { MarkdownView } from '../types';

/**
 * A formatted view's block heights: as each block's Client reported, else its source lines until it has.
 *
 * @returns the lookup by block index
 */
export const rowsOfBlockIn =
  (view: MarkdownView): MarkdownBlocks.RowsOfBlock =>
  (index) => {
    const block = view.blocks[index];

    return view.blockRows[index] ?? (block ? block.end - block.start + 1 : 1);
  };
