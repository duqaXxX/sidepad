import Names from '../names';
import PaneState from '../pane-state';
import type Sidepad from '../sidepad';

/** `/clear` or `/resume` ran: the pane closes and the session's edits, selection and close are forgotten. */
export async function resetSession(sidepad: Sidepad.Sidepad): Promise<void> {
  if (sidepad.state.isOpen) {
    await sidepad.host.closePane({ id: Names.PANE_ID }).catch(() => undefined);
  }

  sidepad.state = PaneState.afterNewSession(PaneState.afterClose(sidepad.state, 'plugin'));
}
