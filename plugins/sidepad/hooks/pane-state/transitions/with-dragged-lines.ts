import type LineRange from '../../line-range';
import type { PaneState } from '../types';
import { revealed } from './revealed';

/**
 * A drag released over lines: the selection settles and is revealed above the bar.
 *
 * @param head the 1-based line the drag ended on
 * @returns the state
 */
export function withDraggedLines(state: PaneState, range: LineRange.LineRange, head: number): PaneState {
  if (!state.file || state.page.kind !== 'file') {
    return state;
  }

  return revealed({ ...state, selection: { range, head, isAsking: false }, press: null });
}
