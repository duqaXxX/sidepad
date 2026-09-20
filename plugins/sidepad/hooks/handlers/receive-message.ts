import PaneState from '../pane-state';
import type Sidepad from '../sidepad';
import SurfaceMessage from '../surface-message';
import { ensureWindow } from './ensure-window';

/** A Client's post: a press, a drag, a click or an edge scroll, applied to the state. */
export function receiveMessage(sidepad: Sidepad.Sidepad, data: unknown): void {
  const message = SurfaceMessage.surfaceMessageOf(data);
  const state = sidepad.state;

  if (message === null) {
    return;
  }

  const next = (() => {
    switch (message.kind) {
      case 'drag-start':
        return PaneState.withPress(state);
      case 'range':
        return PaneState.withDraggedLines(state, { start: message.start, end: message.end }, message.head);
      case 'click':
        return PaneState.withClick(state, message.line);
      case 'scroll':
        return PaneState.scrolledBy(state, { by: message.by, isWheel: false });
      case 'block-down':
        return PaneState.withBlockPress(state, message.row);
      case 'block-move':
        return PaneState.withBlockDrag(state, message.anchor, message.head, false);
      case 'block-up':
        return PaneState.withBlockDrag(state, message.anchor, message.head, true);
    }
  })();

  if (next !== state) {
    sidepad.state = next;
    sidepad.host.invalidate();
    void ensureWindow(sidepad);
  }
}
