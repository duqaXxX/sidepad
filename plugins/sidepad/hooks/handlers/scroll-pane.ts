import type { UiScrollInput } from 'claude-code';

import PaneState from '../pane-state';
import type Sidepad from '../sidepad';
import { ensureWindow } from './ensure-window';

/**
 * A scroll over the pane moves the page's own window: the tree always fits the body, so the engine's
 * window is left still. The wheel carries `pointer`, keys do not; ticks that crowd arrive summed in `by`.
 */
export function scrollPane(sidepad: Sidepad.Sidepad, e: UiScrollInput): void {
  const next = PaneState.scrolledBy(sidepad.state, { by: e.by, isWheel: e.pointer !== undefined });

  if (next !== sidepad.state) {
    sidepad.state = next;
    sidepad.host.invalidate();
    void ensureWindow(sidepad);
  }
}
