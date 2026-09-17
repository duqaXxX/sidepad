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

  if (state.page.kind !== 'file' || !file?.markdown) {
    return state;
  }

  const mode = file.markdown.mode === 'formatted' ? 'source' : 'formatted';

  return clamped({ ...withoutSelection(state), file: { ...file, markdown: { ...file.markdown, mode } } });
}
