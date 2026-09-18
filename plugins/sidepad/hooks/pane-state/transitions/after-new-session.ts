import type { PaneState } from '../types';
import { NO_TURN_EDITS } from '../types';
import { withoutSelection } from './without-selection';

/**
 * The state after `/clear` or `/resume`: closed, nothing edited, no turn, no selection, a person's
 * close forgotten. The page, the open file and the layout are kept.
 *
 * @returns the state
 */
export const afterNewSession = (state: PaneState): PaneState => ({
  ...withoutSelection(state),
  isOpen: false,
  isClosedByPerson: false,
  edited: { paths: [], hasUnseen: false },
  turn: NO_TURN_EDITS,
});
