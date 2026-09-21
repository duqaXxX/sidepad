import type { CommandRunResult } from 'claude-code';

import Names from '../names';
import PaneState from '../pane-state';
import PaneToggle from '../pane-toggle';
import type Sidepad from '../sidepad';
import Theme from '../theme';
import { checkPage } from './check-page';
import { ensureWindow } from './ensure-window';
import { readTheme } from './read-theme';

/**
 * `/sidepad`: bare, closes the open pane or opens it on the page it was on (the session directory's
 * listing the first time), checked against the disk first; `auto`, reads the auto-open switch, and
 * `auto on` or `auto off` sets it first; `theme` names the pane's theme, and `theme` with a theme's
 * name sets it first and draws the pane in it.
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

  if (words[0] === 'theme' && words.length <= 2) {
    const name = Theme.THEME_NAMES.find((theme) => theme === words[1]);

    if (words[1] !== undefined && name === undefined) {
      return { text: Names.USAGE_TEXT };
    }

    if (name !== undefined) {
      await host.storeSet(Names.STORE_THEME_KEY, name);
      sidepad.state = PaneState.withTheme(sidepad.state, { name });

      if (sidepad.state.isOpen) {
        host.invalidate();
      }
    }

    await readTheme(sidepad);

    return { text: Names.themeTextOf(sidepad.state.theme.name) };
  }

  if (words.length > 0) {
    return { text: Names.USAGE_TEXT };
  }

  // LIMIT: Claude Code 2.1.278's `/diff` panel covers the pane while it is open, and the toggle then
  // closes or opens a pane nobody sees. `$.ui.panes()` cannot tell the two apart: it reports the
  // covered pane `isShown` (measured on Claude Code 2.1.278, #42).
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
  await readTheme(sidepad);
  // The person asked for the pane, so it asks for the keyboard: the arrows walk the listing at once.
  // The engine grants it only over an empty composer, a typed character hands it back to the prompt
  // and lands there, and Escape hands it back with the pane left open.
  await host.openPane({ id: Names.PANE_ID, title: Names.PANE_TITLE, focus: true });
  sidepad.state = PaneState.afterOpened(sidepad.state);
  host.invalidate();
  await ensureWindow(sidepad);

  return { text: Names.PANE_SHOWN_TEXT };
}
