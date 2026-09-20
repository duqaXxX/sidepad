import type { PaneState } from '../types';
import { clamped } from './clamped';
import { withoutSelection } from './without-selection';

/**
 * The open Markdown file switched between formatted and source; the selection is cleared.
 *
 * @returns the same object when the open file is not Markdown shown on the file page
 */
export function withMarkdownMode(state: PaneState): PaneState {
  const file = state.file;
  const view = file?.markdown;

  if (state.page.kind !== 'file' || !file || view?.kind !== 'markdown') {
    return state;
  }

  const mode = view.mode === 'formatted' ? 'source' : 'formatted';

  return clamped({ ...withoutSelection(state), file: { ...file, markdown: { ...view, mode } } });
}
