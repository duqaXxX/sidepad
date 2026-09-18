import { formattedViewOf, listRowsShownOf, shownLinesOf } from '../select';
import type { PaneState } from '../types';
import { scrolledBy } from './scrolled-by';

/**
 * The page's window moved one page by a scroll key: as many lines or rows as the page shows, so no
 * line goes by unseen; a formatted Markdown page moves as a key moves it.
 *
 * @param direction 1 toward the end, -1 toward the top
 * @returns the same object when the window did not move
 */
export function pagedBy(state: PaneState, direction: 1 | -1): PaneState {
  if (formattedViewOf(state)) {
    return scrolledBy(state, { by: direction, isWheel: false });
  }

  const page = state.page.kind === 'file' ? shownLinesOf(state) : listRowsShownOf(state);

  return scrolledBy(state, { by: direction * page, isWheel: false });
}
