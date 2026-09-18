import type { CommandRunResult } from 'claude-code';

import Names from '../names';
import PaneState from '../pane-state';
import PaneToggle from '../pane-toggle';
import type Sidepad from '../sidepad';
import { checkPage } from './check-page';
import { ensureWindow } from './ensure-window';

/**
 * `/sidepad`: bare, closes the open pane or opens it on the page it was on (the session directory's
 * listing the first time), checked against the disk first; `auto`, reads the auto-open switch, and
 * `auto on` or `auto off` sets it first.
 *
 * @param args the command's arguments as typed
 * @returns the transcript line
 */
export async function runSidepadCommand(sidepad: Sidepad.Sidepad, args: string): Promise<CommandRunResult> {
  const { host } = sidepad;
  const words = args
    .trim()
    .split(/\s+/)
    .filter((word) => word !== '');

  if (words[0] === 'auto' && words.length <= 2) {
    if (words[1] === 'on' || words[1] === 'off') {
      await host.storeSet(Names.STORE_AUTO_OPEN_KEY, words[1] === 'on');
    } else if (words[1] !== undefined) {
      return { text: Names.USAGE_TEXT };
    }

    return { text: Names.autoOpenTextOf((await host.storeGet(Names.STORE_AUTO_OPEN_KEY)) !== false) };
  }

  if (words.length > 0) {
    return { text: Names.USAGE_TEXT };
  }

  const toggle = PaneToggle.paneToggleOf({ isOpen: sidepad.state.isOpen, columns: sidepad.state.columns });

  if (toggle === 'too-narrow') {
    return { text: Names.RESIZE_TERMINAL_TEXT };
  }

  if (toggle === 'close') {
    // The state follows the intent, not the call: a close that rejects would otherwise leave
    // `isOpen` set and the next `/sidepad` would try to close an already closed pane.
    await host.closePane({ id: Names.PANE_ID }).catch(() => undefined);
    sidepad.state = PaneState.afterClose(sidepad.state, 'plugin');

    return { text: Names.PANE_HIDDEN_TEXT };
  }

  await checkPage(sidepad);
  await host.openPane({ id: Names.PANE_ID, title: Names.PANE_TITLE });
  sidepad.state = PaneState.afterOpened(sidepad.state);
  host.invalidate();
  await ensureWindow(sidepad);

  return { text: Names.PANE_SHOWN_TEXT };
}
