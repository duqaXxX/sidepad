import Window from '../../window';
import { blockOfLine, formattedViewOf, rowsOfBlockIn, shownLinesOf } from '../select';
import type { PaneState } from '../types';
import { clamped } from './clamped';

/**
 * The state scrolled the least that shows its selection above the bar: its lines on a code or source
 * page, its head's block on a formatted page.
 *
 * @returns the same object when nothing is hidden
 */
export function revealed(state: PaneState): PaneState {
  const { file, selection } = state;

  if (!file || !selection || state.page.kind !== 'file') {
    return state;
  }

  const view = formattedViewOf(state);

  if (view) {
    const index = blockOfLine(view.blocks, selection.head);
    const blockTop = Window.revealedBlockTopOf(rowsOfBlockIn(view), view.blockTop, index, shownLinesOf(state));

    return blockTop === view.blockTop ? state : { ...state, file: { ...file, markdown: { ...view, blockTop } } };
  }

  const top = Window.revealedTopOf(file.top, selection.range, selection.head, shownLinesOf(state), file.loaded.total);

  return top === file.top ? state : clamped({ ...state, file: { ...file, top } });
}
