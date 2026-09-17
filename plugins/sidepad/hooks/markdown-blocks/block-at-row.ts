import Limits from '../limits';
import type { RowsOfBlock } from './rows-of-block';

/**
 * The block drawn at a page row at or below the first block shown; the blank row under a block
 * counts as that block's, and a row past the last block as the last one.
 *
 * @returns the block's index, 0 for a file with no block
 */
export function blockAtRow(rowsOf: RowsOfBlock, blockTop: number, count: number, row: number): number {
  let bottom = 0;

  for (let at = blockTop; at < count; at += 1) {
    bottom += rowsOf(at) + Limits.BLOCK_GAP_ROWS;

    if (row < bottom) {
      return at;
    }
  }

  return Math.max(0, count - 1);
}
