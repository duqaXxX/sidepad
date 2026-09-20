import type { ClientPointerEvent } from 'claude-code';

import type SurfaceMessage from '../surface-message';
import type { CodeDrag } from './code-drag';
import type { PageWindow } from './page-window';

/** One pointer event's effect on the formatted page's Client. */
export type PagePointerStep = {
  drag: CodeDrag;
  post: SurfaceMessage.SurfaceMessage | null;
  /** Which edge the held pointer is past (-1 top, 1 bottom, 0 none); null leaves it as it was. */
  edge: -1 | 0 | 1 | null;
};

/**
 * The formatted page's reaction to a pointer event: a left press starts a selection on the row under
 * it, a move while pressed carries the rows pressed and reached, and a release settles them. `y` is
 * relative to this Client's own content, so the page row is its first row plus it, and the pointer
 * is past an edge only once that row leaves the window every Client of the page shares.
 *
 * Both rows travel in every message: the Client holds the pointer from the press to the release, so
 * a press whose post was replaced before the engine delivered it costs nothing.
 *
 * @returns the drag after the event, the message to post, and the edge
 */
export function pagePointerStep(drag: CodeDrag, event: ClientPointerEvent, window: PageWindow): PagePointerStep {
  const last = window.firstRow + Math.max(1, window.rowCount) - 1;
  const at = window.clientFirstRow + event.y;
  const row = Math.max(window.firstRow, Math.min(at, last));

  if (event.type === 'down') {
    if (event.button !== 'left') {
      return { drag, post: null, edge: null };
    }

    return {
      drag: { ...drag, anchor: row, head: row, isDragging: true, hasMoved: false },
      post: { kind: 'block-down', row },
      edge: 0,
    };
  }

  if (event.type === 'move' && drag.isDragging) {
    const edge = at < window.firstRow ? -1 : at > last ? 1 : 0;

    if (edge !== 0 || row === drag.head) {
      return { drag, post: null, edge };
    }

    return {
      drag: { ...drag, head: row, hasMoved: true },
      post: { kind: 'block-move', anchor: drag.anchor ?? row, head: row },
      edge,
    };
  }

  if (event.type === 'up' && drag.isDragging) {
    const next = { ...drag, isDragging: false };

    return {
      drag: next,
      post: { kind: 'block-up', anchor: next.anchor ?? row, head: next.head ?? row },
      edge: 0,
    };
  }

  return { drag, post: null, edge: null };
}
