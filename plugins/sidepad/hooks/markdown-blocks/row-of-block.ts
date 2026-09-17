import Limits from '../limits';
import type { RowsOfBlock } from './rows-of-block';

/**
 * The page row a block starts on, counted from the first block shown (row 0); a block above it
 * starts on a negative row. A blank row separates two blocks.
 *
 * @returns the row
 */
export function rowOfBlock(rowsOf: RowsOfBlock, blockTop: number, index: number): number {
  let row = 0;

  for (let at = Math.min(index, blockTop); at < Math.max(index, blockTop); at += 1) {
    row += rowsOf(at) + Limits.BLOCK_GAP_ROWS;
  }

  return index >= blockTop ? row : -row;
}
