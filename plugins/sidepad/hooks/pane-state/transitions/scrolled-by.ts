import Limits from '../../limits';
import { formattedViewOf } from '../select';
import type { PaneState } from '../types';
import { clamped } from './clamped';

/**
 * The page's window moved by a scroll: lines of a file or rows of a list (WHEEL_LINES a wheel tick,
 * `by` itself for keys and edge ticks), blocks of formatted Markdown (one a wheel tick,
 * KEY_SCROLL_BLOCKS a key).
 *
 * @param scroll `by` as the scroll carries it, and whether it came from the wheel
 * @returns the same object when the window did not move
 */
export function scrolledBy(state: PaneState, scroll: { by: number; isWheel: boolean }): PaneState {
  const lines = scroll.isWheel ? scroll.by * Limits.WHEEL_LINES : scroll.by;
  const view = formattedViewOf(state);
  const file = state.file;
  const page = state.page;

  if (view && file) {
    const blocks = scroll.isWheel ? scroll.by : Math.sign(scroll.by) * Limits.KEY_SCROLL_BLOCKS;
    const next = clamped({ ...state, file: { ...file, markdown: { ...view, blockTop: view.blockTop + blocks } } });

    return next.file?.markdown?.blockTop === view.blockTop ? state : next;
  }

  if (page.kind === 'file') {
    if (!file) {
      return state;
    }

    const next = clamped({ ...state, file: { ...file, top: file.top + lines } });

    return next.file?.top === file.top ? state : next;
  }

  const next = clamped({ ...state, page: { ...page, top: page.top + lines } });

  return next.page.kind !== 'file' && next.page.top === page.top ? state : next;
}
