import type { PaneLayout, PaneState } from '../types';
import { clamped } from './clamped';
import { revealed } from './revealed';

/**
 * The state for a drawing's body size: windows kept inside it, and on a new width a selection
 * revealed again, since the bar may take more or fewer rows. A height change alone reveals nothing.
 *
 * @returns the same object when the size is the same
 */
export function laidOut(state: PaneState, layout: PaneLayout): PaneState {
  if (layout.rows === state.layout.rows && layout.columns === state.layout.columns) {
    return state;
  }

  const next = clamped({ ...state, layout });

  return layout.columns !== state.layout.columns ? revealed(next) : next;
}
