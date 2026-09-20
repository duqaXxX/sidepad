import Window from '../../window';
import { formattedPageOf, listRowsShownOf, pageRowsOf, shownLinesOf } from '../select';
import type { PaneState } from '../types';

/**
 * The state with every window kept inside what it scrolls: the file's lines, the formatted page's
 * rows, the list's rows.
 *
 * @returns the same object when nothing moved
 */
export function clamped(state: PaneState): PaneState {
  let next = state;
  const file = state.file;

  if (file) {
    const shown = shownLinesOf(state);
    const top = Window.clampedTopOf(file.top, file.loaded.total, shown);
    const markdown = file.markdown;
    const page = formattedPageOf(state);
    const pageTop = markdown && Window.clampedTopOf(markdown.top, page ? page.rows : 0, shown);

    if (top !== file.top || (markdown && pageTop !== markdown.top)) {
      next = {
        ...next,
        file: { ...file, top, markdown: markdown && { ...markdown, top: pageTop ?? 0 } },
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
