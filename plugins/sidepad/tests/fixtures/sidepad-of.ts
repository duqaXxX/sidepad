import type Host from '../../hooks/host';
import type PaneState from '../../hooks/pane-state';

/** What a handler is called with in a test: the fake engine and a state built by the transitions. */
export const sidepadOf = (host: Host.Host, state: PaneState.PaneState) => ({ host, state, isReading: false });
