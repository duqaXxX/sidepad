import type LineRange from '../../line-range';

/**
 * The block a source line falls in, or the last block starting before it (a blank line between blocks).
 *
 * @returns the block's index, 0 when none starts before the line
 */
export const blockOfLine = (blocks: readonly LineRange.LineRange[], line: number) =>
  Math.max(
    0,
    blocks.findLastIndex((block) => block.start <= line),
  );
