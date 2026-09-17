import Limits from '../limits';
import type { RowsOfBlock } from './rows-of-block';

/**
 * The blocks a window of rows draws from the first block shown: each one that starts inside it.
 *
 * @returns their indexes, in order
 */
export function shownBlocksOf(rowsOf: RowsOfBlock, blockTop: number, count: number, windowRows: number): number[] {
  const shown: number[] = [];

  for (let at = blockTop, used = 0; at < count && used < windowRows; at += 1) {
    shown.push(at);
    used += rowsOf(at) + Limits.BLOCK_GAP_ROWS;
  }

  return shown;
}
