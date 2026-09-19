import Limits from '../../limits';
import type { PaneState } from '../types';

/**
 * The columns a page is drawn in: the body less its left padding.
 *
 * @returns at least 1
 */
export const pageColumnsOf = (state: PaneState) => Math.max(1, state.layout.columns - Limits.PAGE_PADDING);
