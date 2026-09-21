import Names from '../names';
import PaneState from '../pane-state';
import Paths from '../paths';
import type Sidepad from '../sidepad';
import { ensureWindow } from './ensure-window';
import { listDirectory } from './list-directory';
import { loadFile } from './load-file';

/**
 * A Button pressed in the pane: `..`, a path piece, `Edited N`, `Source`/`Formatted`, a list row, or
 * a command of the bar. A preset submits its prompt at once; the selection rides it as context.
 *
 * @param element the pressed Button's key
 * @param submit `$.prompt.submit` on the pressing hook's own `$`
 */
export async function pressInPane(
  sidepad: Sidepad.Sidepad,
  element: string,
  submit: (text: string) => Promise<unknown>,
): Promise<void> {
  const { host } = sidepad;
  const state = sidepad.state;
  const page = state.page;
  const shown = page.kind === 'file' ? (state.file?.loaded.path ?? null) : page.kind === 'directory' ? page.path : null;
  const depth = Names.indexOfKey('crumb', element);
  const rowIndex = Names.indexOfKey('row', element);
  const command = Names.BAR_COMMANDS.find((candidate) => Names.idOfKey('command', element) === candidate.id);

  if (element === Names.NAV_UP_KEY && shown !== null && !(page.kind === 'directory' && shown === state.cwd)) {
    const parent = Paths.parentOf(shown);

    sidepad.state = PaneState.withDirectory(sidepad.state, parent, await listDirectory(host, parent), shown, null);
  } else if (depth !== null && shown !== null) {
    const directory = Paths.crumbPathOf(shown, state.cwd, depth);
    const cameFrom = Paths.crumbPathOf(shown, state.cwd, depth + 1);

    if (directory === null || directory === shown) {
      return;
    }

    sidepad.state = PaneState.withDirectory(
      sidepad.state,
      directory,
      await listDirectory(host, directory),
      cameFrom ?? '',
      null,
    );
  } else if (element === Names.NAV_EDITED_KEY) {
    sidepad.state = PaneState.withEditedPage(state);
  } else if (element === Names.NAV_MODE_KEY) {
    sidepad.state = PaneState.withPageMode(state);
  } else if (rowIndex !== null) {
    const row = PaneState.pageRowsOf(state)[rowIndex];

    if (row?.kind === 'dir') {
      sidepad.state = PaneState.withDirectory(sidepad.state, row.path, await listDirectory(host, row.path), '', null);
    } else if (row?.kind === 'file') {
      sidepad.state =
        row.path === state.file?.loaded.path
          ? PaneState.withFileShown(state)
          : PaneState.withFile(sidepad.state, await loadFile(host, row.path), null);
    }
  } else if (command && state.selection) {
    if (command.prompt === null) {
      sidepad.state = PaneState.withAsking(state);
    } else {
      void submit(command.prompt).catch(() => undefined);
    }
  }

  if (sidepad.state !== state) {
    host.invalidate();
    await ensureWindow(sidepad);
  }
}
