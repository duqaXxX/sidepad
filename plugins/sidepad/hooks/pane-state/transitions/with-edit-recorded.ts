import type Follow from '../../follow';
import type { PaneState } from '../types';

/**
 * An edit that landed: the file goes first in the edited list and joins the running turn; the first
 * edit of a turn records the latest file before it, and an edit of the file holding the selection
 * records that it clears it.
 *
 * @returns the state; the selection itself is cleared by the re-read that follows
 */
export function withEditRecorded(state: PaneState, edit: Follow.TurnEdit): PaneState {
  const { turn, edited } = state;
  const isClearing = state.selection !== null && state.file?.loaded.path === edit.path;

  return {
    ...state,
    edited: { ...edited, paths: [edit.path, ...edited.paths.filter((path) => path !== edit.path)] },
    turn: {
      edits: [...turn.edits, edit],
      latestBefore: turn.edits.length === 0 ? (edited.paths[0] ?? null) : turn.latestBefore,
      clearedOn: isClearing && !turn.clearedOn.includes(edit.path) ? [...turn.clearedOn, edit.path] : turn.clearedOn,
    },
  };
}
