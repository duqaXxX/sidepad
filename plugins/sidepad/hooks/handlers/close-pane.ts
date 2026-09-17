import type { PaneCloseInput } from 'claude-code';

import PaneState from '../pane-state';
import type Sidepad from '../sidepad';

/** The pane closed; a person's close with its mark keeps later edits from reopening it this session. */
export function closePane(sidepad: Sidepad.Sidepad, e: PaneCloseInput): void {
  sidepad.state = PaneState.afterClose(sidepad.state, e.origin.kind);
}
