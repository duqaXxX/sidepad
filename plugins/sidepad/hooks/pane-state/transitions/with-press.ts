import type { PaneState } from '../types';

/**
 * A press started on a line of code or source: the bar is hidden at once so it does not cover the
 * lines being selected, and the selection before it is kept to tell a toggling click.
 *
 * @returns the state
 */
export const withPress = (state: PaneState): PaneState => ({
  ...state,
  selection: null,
  press: { before: state.selection?.range ?? null, blocks: null },
});
