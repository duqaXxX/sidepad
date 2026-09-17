import Window from '../../window';
import { listRowsShownOf, pageRowsOf, shownLinesOf } from '../select';
import type { PaneState } from '../types';

/**
 * The state with every window kept inside what it scrolls: the file's lines, the formatted blocks,
 * the list's rows.
 *
 * @returns the same object when nothing moved
 */
export function clamped(state: PaneState): PaneState {
  let next = state;
  const file = state.file;

  if (file) {
    const top = Window.clampedTopOf(file.top, file.loaded.total, shownLinesOf(state));
    const markdown = file.markdown;
    const blockTop = markdown && Math.max(0, Math.min(markdown.blockTop, markdown.blocks.length - 1));

    if (top !== file.top || (markdown && blockTop !== markdown.blockTop)) {
      next = {
        ...next,
        file: { ...file, top, markdown: markdown && { ...markdown, blockTop: blockTop ?? 0 } },
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
