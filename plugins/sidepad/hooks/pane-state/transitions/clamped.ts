import Window from '../../window';
import { listRowsShownOf, markdownPageOf, pageRowsOf, shownLinesOf } from '../select';
import type { PaneState } from '../types';

/**
 * The state with every window kept inside what it scrolls: the file's lines, the Markdown page's
 * rows, the list's rows.
 *
 * The Markdown page is clamped whichever page is drawn: its rows do not depend on the mode, and a
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
    const markdown = file.markdown;
    const laid = markdownPageOf(state);
    const pageTop = markdown && laid ? Window.clampedTopOf(markdown.top, laid.rows, shown) : (markdown?.top ?? 0);

    if (top !== file.top || (markdown && pageTop !== markdown.top)) {
      next = {
        ...next,
        file: { ...file, top, markdown: markdown && { ...markdown, top: pageTop } },
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
