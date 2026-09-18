import type { UiScrollInput } from 'claude-code';

import PaneState from '../pane-state';
import type Sidepad from '../sidepad';
import { ensureWindow } from './ensure-window';

/**
 * A scroll over the pane moves the page's own window: the tree always fits the body, so the engine's
 * window is left still. The wheel carries `pointer` and moves by its ticks, summed in `by` when they
 * crowd. A key carries none and moves one page of what the page shows: the engine's `by` counts its
 * own body rows, which hold the header rows and the bar besides the page's lines.
 *
 * LIMIT: Claude Code 2.1.277 sends no `ui.scroll` for the first wheel tick after the wheel changes
 * direction (#38), so that tick moves nothing.
 *
 * LIMIT: Home and End arrive as `by` the engine's own tree rows, and that tree always fits the body,
 * so they move one page, as Page Up and Page Down do (Claude Code 2.1.277).
 */
export function scrollPane(sidepad: Sidepad.Sidepad, e: UiScrollInput): void {
  const state = sidepad.state;
  const next =
    e.pointer !== undefined
      ? PaneState.scrolledBy(state, { by: e.by, isWheel: true })
      : e.by === 0
        ? state
        : PaneState.pagedBy(state, e.by > 0 ? 1 : -1);

  if (next !== state) {
    sidepad.state = next;
    sidepad.host.invalidate();
    void ensureWindow(sidepad);
  }
}
