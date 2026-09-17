import type { PaneState } from '../types';

/**
 * A block's height as its Client reported it.
 *
 * @returns the same object when the open file has no Markdown view or the height is known already
 */
export function withBlockRows(state: PaneState, index: number, rows: number): PaneState {
  const file = state.file;
  const view = file?.markdown;

  if (!file || !view || view.blockRows[index] === rows || index >= view.blocks.length) {
    return state;
  }

  return { ...state, file: { ...file, markdown: { ...view, blockRows: { ...view.blockRows, [index]: rows } } } };
}
