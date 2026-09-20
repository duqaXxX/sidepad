import Limits from '../../limits';
import { formattedViewOf } from '../select';
import type { PaneState } from '../types';
import { clamped } from './clamped';

/**
 * The page's window moved by a scroll: lines of a file, rows of a formatted page or of a list,
 * WHEEL_LINES a wheel tick and `by` itself for keys and edge ticks.
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
    const next = clamped({ ...state, file: { ...file, markdown: { ...view, top: view.top + lines } } });

    return next.file?.markdown?.top === view.top ? state : next;
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
