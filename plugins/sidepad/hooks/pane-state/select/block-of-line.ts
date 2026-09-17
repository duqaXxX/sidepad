import type MarkdownBlocks from '../../markdown-blocks';

/**
 * The block a source line falls in, or the last block starting before it (a blank line between blocks).
 *
 * @returns the block's index, 0 when none starts before the line
 */
export const blockOfLine = (blocks: readonly MarkdownBlocks.MarkdownBlock[], line: number) =>
  Math.max(
    0,
    blocks.findLastIndex((block) => block.start <= line),
  );
