import type { TurnCompleteInput } from 'claude-code';

import Names from '../names';
import PaneState from '../pane-state';
import type Sidepad from '../sidepad';
import { ensureWindow } from './ensure-window';
import { loadFile } from './load-file';
import { readTheme } from './read-theme';

/**
 * The end of a turn. Only the main loop's counts: a subagent's turn carries `agentId`, and its edits
 * are applied at its parent's end. The pane opens on or follows the turn's last edited file, whatever
 * the pace of the edits (edits a person approves arrive at the person's pace, so no pause groups
 * them), an interrupted turn included; or `Edited N` is marked. Claude Code's theme is read again
 * first, since a change of it raises nothing the pane hears.
 */
export async function completeTurn(sidepad: Sidepad.Sidepad, e: TurnCompleteInput): Promise<void> {
  if (e.agentId !== undefined) {
    return;
  }

  await readTheme(sidepad);

  if (sidepad.state.turn.edits.length === 0) {
    return;
  }

  const isAutoOpenOn = (await sidepad.host.storeGet(Names.STORE_AUTO_OPEN_KEY)) !== false;
  const { state, action } = PaneState.afterTurn(sidepad.state, isAutoOpenOn);

  sidepad.state = state;

  if (action.kind === 'open' || action.kind === 'follow') {
    sidepad.state = PaneState.withFile(sidepad.state, await loadFile(sidepad.host, action.path), action.line);
  }

  if (action.kind === 'open') {
    // Unasked, so no `focus`: the keys stay with the prompt, whose Up is the person's history.
    await sidepad.host.openPane({ id: Names.PANE_ID, title: Names.PANE_TITLE });
    sidepad.state = PaneState.afterOpened(sidepad.state);
  }

  if (sidepad.state.isOpen) {
    sidepad.host.invalidate();
    await ensureWindow(sidepad);
  }
}
