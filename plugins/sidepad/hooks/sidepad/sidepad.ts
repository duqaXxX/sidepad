import type Host from '../host';
import type PaneState from '../pane-state';

/** What every handler reads and replaces: the bound engine, the pane's state, and the one read running. */
export type Sidepad = {
  host: Host.Host;
  state: PaneState.PaneState;
  /** Whether a window of a file too large to read whole is being read now. */
  isReading: boolean;
};
