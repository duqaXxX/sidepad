import type { PaneState } from '../types';
import { listColumnsOf } from './list-columns-of';
import { noteRowsOf } from './note-rows-of';

/**
 * The directory page's dim note as the rows it takes above the list: a listing's failure before what
 * left the disk.
 *
 * @returns the rows, none on a page with no note
 */
export function pageNoteRowsOf(state: PaneState): readonly string[] {
  const note = state.page.kind === 'directory' ? (state.page.failure ?? state.page.note) : null;

  return note === null ? [] : noteRowsOf(note, listColumnsOf(state));
}
