import type { RenderViewport } from 'claude-code';

import PaneState from '../pane-state';
import type Sidepad from '../sidepad';

/**
 * The terminal's width and layout, read off the hint line under the prompt, which the engine draws
 * whatever the pane is doing. It is how both are known before a pane exists, as `diff` learns the
 * width: the terminal says `isFullscreen` from its first drawing, before `session.start`, so an edit
 * never opens the pane on the main screen.
 *
 * @param viewport what the terminal's drawing reported
 */
export function learnViewport(sidepad: Sidepad.Sidepad, viewport: RenderViewport | undefined): void {
  const sized = PaneState.withColumns(sidepad.state, viewport?.columns);

  sidepad.state = viewport?.isFullscreen === undefined ? sized : PaneState.withScreen(sized, viewport.isFullscreen);
}
