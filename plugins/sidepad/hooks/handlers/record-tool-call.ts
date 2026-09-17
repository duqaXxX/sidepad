import type { Args, ResultOf } from 'claude-code';

import Edits from '../edits';
import PaneState from '../pane-state';
import type Sidepad from '../sidepad';
import Tools from '../tools';
import { checkPage } from './check-page';
import { ensureWindow } from './ensure-window';
import { loadFile } from './load-file';

/**
 * A tool call finished. An edit that landed joins the edited list and the running turn, and the open
 * file is read again in place when the pane shows it; which file the pane shows waits for the turn's
 * end. A shell command that was not refused, failed ones included, has the open pane check its page.
 */
export async function recordToolCall(
  sidepad: Sidepad.Sidepad,
  e: Args<'tool.call'>,
  result: ResultOf['tool.call'],
): Promise<void> {
  if (Tools.EDITING_TOOLS.some((tool) => tool === e.tool)) {
    const path = Edits.editedPathOf(e);

    if (path === null || !Edits.hasLanded(result)) {
      return;
    }

    sidepad.state = PaneState.withEditRecorded(sidepad.state, {
      path,
      changedLine: Edits.changedLineOf(result.result),
    });

    if (sidepad.state.isOpen && sidepad.state.file?.loaded.path === path) {
      sidepad.state = PaneState.withFileReloaded(sidepad.state, await loadFile(sidepad.host, path));
      await ensureWindow(sidepad);
    }
  } else if (result.deny === undefined && sidepad.state.isOpen) {
    await checkPage(sidepad);
  }

  if (sidepad.state.isOpen) {
    sidepad.host.invalidate();
  }
}
