import type { PaneState } from '../types';
import { windowRowsOf } from './window-rows-of';

/**
 * The list rows a list page shows under its note.
 *
 * @returns at least 1
 */
export function listRowsShownOf(state: PaneState): number {
  const hasNote = state.page.kind === 'directory' && state.page.note !== null;

  return Math.max(1, windowRowsOf(state) - (hasNote ? 1 : 0));
}
