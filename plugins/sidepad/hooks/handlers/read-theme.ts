import Names from '../names';
import PaneState from '../pane-state';
import type Sidepad from '../sidepad';
import Theme from '../theme';

/**
 * Reads the pane's theme from the store and Claude Code's `theme` setting, and draws the pane again
 * when either changed. Called when the session starts, when `/sidepad` opens the pane and when a
 * turn ends: the `/theme` picker raises no `config.set` (measured on Claude Code 2.1.278), so a
 * change there reaches `classic` at the next of those. A read that fails keeps what was read
 * before: a store that cannot be read is not an empty one, which means `auto`.
 */
export async function readTheme(sidepad: Sidepad.Sidepad): Promise<void> {
  const { host } = sidepad;
  const [stored, claude] = await Promise.all([
    host.storeGet(Names.STORE_THEME_KEY).then(
      (value) => ({ name: Theme.themeNameOf(value) }),
      () => ({}),
    ),
    host.claudeTheme().then(
      (value) => ({ claude: value }),
      () => ({}),
    ),
  ]);
  const before = sidepad.state;

  sidepad.state = PaneState.withTheme(sidepad.state, { ...stored, ...claude });

  if (sidepad.state !== before && sidepad.state.isOpen) {
    host.invalidate();
  }
}
