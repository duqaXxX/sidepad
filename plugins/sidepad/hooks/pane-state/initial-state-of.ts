import type { PaneState } from './types';
import { NO_TURN_EDITS } from './types';

/**
 * The pane before anything happened: closed, on the session directory's listing (read when the pane
 * first opens), nothing edited, the layout unknown.
 *
 * @returns the state
 */
export const initialStateOf = (cwd: string): PaneState => ({
  cwd,
  isOpen: false,
  isClosedByPerson: false,
  screen: null,
  columns: null,
  layout: { rows: 0, columns: 0 },
  file: null,
  page: { kind: 'directory', path: cwd, entries: [], cameFrom: '', top: 0, note: null, failure: null },
  selection: null,
  press: null,
  epoch: 0,
  edited: { paths: [], hasUnseen: false },
  turn: NO_TURN_EDITS,
});
