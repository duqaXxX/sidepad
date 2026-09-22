import Follow from '../../follow';
import { shownFileOf } from '../select';
import type { PaneState } from '../types';
import { NO_TURN_EDITS } from '../types';

/**
 * The main loop's turn ended: the follow rule decides, the turn's edits are forgotten, and `Edited N`
 * is marked when the person reads something else.
 *
 * @param isAutoOpenOn the stored switch
 * @returns the state and what the handler does with the pane
 */
export function afterTurn(state: PaneState, isAutoOpenOn: boolean): { state: PaneState; action: Follow.FollowAction } {
  const action = Follow.followAtTurnEnd({
    ...state.turn,
    isOpen: state.isOpen,
    isAutoOpenOn,
    isClosedByPerson: state.isClosedByPerson,
    screen: state.screen,
    shownFile: shownFileOf(state),
  });
  const hasUnseen =
    action.kind === 'mark' ? true : action.kind === 'open' || action.kind === 'follow' ? false : state.edited.hasUnseen;

  return { state: { ...state, turn: NO_TURN_EDITS, edited: { ...state.edited, hasUnseen } }, action };
}
