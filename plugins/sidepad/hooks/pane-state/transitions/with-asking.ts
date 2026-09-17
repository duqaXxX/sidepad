import type { PaneState } from '../types';
import { revealed } from './revealed';

/**
 * Ask… pressed: the bar shows where to type, which can take more rows, so the selection's end is
 * revealed again.
 *
 * @returns the state with the selection asking; the same object when nothing is selected
 */
export function withAsking(state: PaneState): PaneState {
  const selection = state.selection;

  return selection
    ? revealed({ ...state, selection: { ...selection, isAsking: true, head: selection.range.end } })
    : state;
}
