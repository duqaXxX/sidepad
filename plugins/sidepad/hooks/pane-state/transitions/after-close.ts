import type { PaneCloseOrigin } from 'claude-code';

import type { PaneState } from '../types';

/**
 * The pane closed; a person's close keeps it closed to edits for the session.
 *
 * @returns the state
 */
export const afterClose = (state: PaneState, origin: PaneCloseOrigin['kind']): PaneState => ({
  ...state,
  isOpen: false,
  isPlacementUnchecked: false,
  isClosedByPerson: state.isClosedByPerson || origin === 'person',
});
