import type { PaneState } from '../types';
import { clamped } from './clamped';
import { withoutSelection } from './without-selection';

/**
 * The open file switched between its composed page and its own lines; the selection is cleared. A
 * Markdown file and a delimited file both have the two; every other file has one.
 *
 * @returns the same object when the open file has no second page
 */
export function withMarkdownMode(state: PaneState): PaneState {
  const file = state.file;
  const view = file?.markdown;

  if (state.page.kind !== 'file' || !file || !view) {
    return state;
  }

  const mode = view.mode === 'formatted' ? 'source' : 'formatted';

  return clamped({ ...withoutSelection(state), file: { ...file, markdown: { ...view, mode } } });
}
