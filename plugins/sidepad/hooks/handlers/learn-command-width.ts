import type { CommandPresentation } from 'claude-code';

import PaneState from '../pane-state';
import type Sidepad from '../sidepad';

/**
 * Any command the person runs carries the terminal's width, read again every time, since a person
 * resizes.
 */
export function learnCommandWidth(sidepad: Sidepad.Sidepad, presentation: CommandPresentation): void {
  sidepad.state = PaneState.withColumns(sidepad.state, presentation.columns);
}
