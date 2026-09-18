import type { PaneState } from '../types';
import { pageNoteRowsOf } from './page-note-rows-of';
import { windowRowsOf } from './window-rows-of';

/**
 * The list rows a list page shows under its note's rows.
 *
 * @returns at least 1
 */
export function listRowsShownOf(state: PaneState): number {
  return Math.max(1, windowRowsOf(state) - pageNoteRowsOf(state).length);
}
