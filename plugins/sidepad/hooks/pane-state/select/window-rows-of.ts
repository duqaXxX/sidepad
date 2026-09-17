import Limits from '../../limits';
import type { PaneState } from '../types';

/**
 * The rows a page takes: the body less the top row and its blank row.
 *
 * @returns at least 1
 */
export const windowRowsOf = (state: PaneState) => Math.max(1, state.layout.rows - Limits.HEADER_ROWS);
