import Window from '../../window';
import { composedPageOf, listRowsShownOf, pageRowsOf, shownLinesOf } from '../select';
import type { PaneState } from '../types';

/**
 * The state with every window kept inside what it scrolls: the file's lines, the composed page's
 * rows, the list's rows.
 *
 * The composed page is clamped whichever page is drawn: its rows do not depend on the mode, and a
 * clamp against a page of no rows while `Source` shows would send the reader back to the top.
 *
 * @returns the same object when nothing moved
 */
export function clamped(state: PaneState): PaneState {
  let next = state;
  const file = state.file;

  if (file) {
    const shown = shownLinesOf(state);
    const top = Window.clampedTopOf(file.top, file.loaded.total, shown);
    const view = file.view;
    const laid = composedPageOf(state);
    const pageTop = view && laid ? Window.clampedTopOf(view.top, laid.rows, shown) : (view?.top ?? 0);

    if (top !== file.top || (view && pageTop !== view.top)) {
      next = {
        ...next,
        file: { ...file, top, view: view && { ...view, top: pageTop } },
      };
    }
  }

  const page = next.page;

  if (page.kind !== 'file') {
    const top = Window.clampedTopOf(page.top, pageRowsOf(next).length, listRowsShownOf(next));

    if (top !== page.top) {
      next = { ...next, page: { ...page, top } };
    }
  }

  return next;
}
