import type { CommandPresentation } from 'claude-code';

import PaneState from '../pane-state';
import type Sidepad from '../sidepad';

/**
 * Any command the person runs carries the layout and the terminal's width: the layout is fixed per
 * session and the first command settles it, so an edit never opens the pane on the main screen,
 * where it would be two rows tall; the width is read again every time, since a person resizes.
 */
export function learnScreen(sidepad: Sidepad.Sidepad, presentation: CommandPresentation): void {
  sidepad.state = PaneState.withColumns(
    PaneState.withScreen(sidepad.state, presentation.isFullscreen),
    presentation.columns,
  );
}
