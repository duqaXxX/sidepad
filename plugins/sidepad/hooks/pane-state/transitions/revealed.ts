import Window from '../../window';
import { blockOfLine, formattedPageOf, formattedViewOf, shownLinesOf } from '../select';
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
    const page = formattedPageOf(state);
    const placed = page?.blocks[blockOfLine(view.blocks, selection.head)];

    if (!page || !placed) {
      return state;
    }

    const shown = shownLinesOf(state);
    const top = Window.clampedTopOf(
      Window.revealedBlockTopOf(view.top, placed.firstRow, placed.layout.rows, shown),
      page.rows,
      shown,
    );

    return top === view.top ? state : { ...state, file: { ...file, markdown: { ...view, top } } };
  }

  const top = Window.revealedTopOf(file.top, selection.range, selection.head, shownLinesOf(state), file.loaded.total);

  return top === file.top ? state : clamped({ ...state, file: { ...file, top } });
}
