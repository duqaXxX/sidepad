import type { PaneState } from '../types';

/**
 * The pane opened: by `/sidepad`, which also forgets a person's close, or by an edit whose layout is
 * still unknown, whose first drawing then decides whether it stays.
 *
 * @param isPlacementUnchecked whether the first drawing must check the placement
 * @returns the state
 */
export const afterOpened = (state: PaneState, isPlacementUnchecked: boolean): PaneState => ({
  ...state,
  isOpen: true,
  isClosedByPerson: false,
  isPlacementUnchecked,
});
