import type Host from '../host';
import Names from '../names';
import PaneState from '../pane-state';
import type Sidepad from '../sidepad';
import { checkPage } from './check-page';

/**
 * A session, or a plugin reload, begins: `/sidepad` is registered and the pane starts from nothing.
 * A command that could not be registered leaves the rest working: the pane still follows edits. A
 * pane the engine still holds, which a reload leaves up, is taken as open and shows the session
 * directory's listing.
 *
 * LIMIT: a reload starts from an empty state; an open pane's page and the edited list are gone.
 *
 * @returns what the handlers share from now on
 */
export async function startSession(host: Host.Host, cwd: string): Promise<Sidepad.Sidepad> {
  await host.registerCommand(Names.COMMAND_SPEC).catch(() => undefined);

  const sidepad: Sidepad.Sidepad = { host, state: PaneState.initialStateOf(cwd), isReading: false };
  const isUp = await host.panes().then(
    (panes) => panes.some((pane) => pane.id === Names.PANE_ID),
    () => false,
  );

  if (isUp) {
    sidepad.state = PaneState.afterOpened(sidepad.state);
    await checkPage(sidepad);
    host.invalidate();
  }

  return sidepad;
}
