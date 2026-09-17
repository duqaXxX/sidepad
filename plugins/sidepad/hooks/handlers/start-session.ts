import type Host from '../host';
import Names from '../names';
import PaneState from '../pane-state';
import type Sidepad from '../sidepad';

/**
 * A session, or a plugin reload, begins: `/sidepad` is registered and the pane starts from nothing.
 * A command that could not be registered leaves the rest working: the pane still follows edits.
 *
 * LIMIT: a reload starts from an empty state; an open pane's page and the edited list are gone.
 *
 * @returns what the handlers share from now on
 */
export async function startSession(host: Host.Host, cwd: string): Promise<Sidepad.Sidepad> {
  await host.registerCommand(Names.COMMAND_SPEC).catch(() => undefined);

  return { host, state: PaneState.initialStateOf(cwd), isReading: false };
}
