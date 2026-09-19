import type { PaneState } from '../types';
import { pageColumnsOf } from './page-columns-of';

/**
 * The columns a list row and a note row are drawn in: the page less one.
 *
 * @returns at least 1
 */
export const listColumnsOf = (state: PaneState) => Math.max(1, pageColumnsOf(state) - 1);
