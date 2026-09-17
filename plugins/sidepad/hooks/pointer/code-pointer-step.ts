import type { ClientPointerEvent } from 'claude-code';

import type SurfaceMessage from '../surface-message';
import type { CodeDrag } from './code-drag';
import type { CodeWindow } from './code-window';
import { draggedRangeOf } from './dragged-range-of';

/** One pointer event's effect on the code Client. */
export type CodePointerStep = {
  drag: CodeDrag;
  post: SurfaceMessage.SurfaceMessage | null;
  /** Which edge the held pointer is past (-1 top, 1 bottom, 0 none); null leaves it as it was. */
  edge: -1 | 0 | 1 | null;
};

/**
 * The code Client's reaction to a pointer event: a left press on a line starts a selection (never
 * on the bar's rows), a move while pressed extends it or reports an edge, a release posts the range
 * dragged or, when the press never left its line, a click. `y` is relative to the Client's own
 * content, so it maps to a line with no offset arithmetic.
 *
 * @returns the drag after the event, the message to post, and the edge
 */
export function codePointerStep(drag: CodeDrag, event: ClientPointerEvent, window: CodeWindow): CodePointerStep {
  const visible = Math.max(1, window.lineCount);
  const line = window.firstLine + Math.max(0, Math.min(event.y, visible - 1));

  if (event.type === 'down') {
    if (event.button !== 'left' || (window.barTop !== null && event.y >= window.barTop)) {
      return { drag, post: null, edge: null };
    }

    return {
      drag: { ...drag, anchor: line, head: line, isDragging: true, hasMoved: false },
      post: { kind: 'drag-start' },
      edge: 0,
    };
  }

  if (event.type === 'move' && drag.isDragging) {
    const edge = event.y < 0 ? -1 : event.y >= visible ? 1 : 0;
    const isNewLine = edge === 0 && line !== drag.head;

    return { drag: isNewLine ? { ...drag, head: line, hasMoved: true } : drag, post: null, edge };
  }

  if (event.type === 'up' && drag.isDragging) {
    const next = { ...drag, isDragging: false };
    const range = draggedRangeOf(next);
    const post: SurfaceMessage.SurfaceMessage =
      next.hasMoved && range
        ? { kind: 'range', ...range, head: (next.head ?? 0) + 1 }
        : { kind: 'click', line: (next.anchor ?? 0) + 1 };

    return { drag: next, post, edge: 0 };
  }

  return { drag, post: null, edge: null };
}
