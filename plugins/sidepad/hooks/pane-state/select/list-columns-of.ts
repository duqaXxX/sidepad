import type { PaneState } from '../types';

/**
 * The columns a list row and a note row are drawn in: the body less one.
 *
 * @returns at least 1
 */
export const listColumnsOf = (state: PaneState) => Math.max(1, state.layout.columns - 1);
