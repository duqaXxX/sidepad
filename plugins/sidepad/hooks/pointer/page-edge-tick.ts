import type SurfaceMessage from '../surface-message';
import type { CodeDrag } from './code-drag';
import type { PageWindow } from './page-window';

/**
 * One tick of a drag held past the formatted page's edge: the head moves one row past the edge row
 * shown, and the hooks bring that row into view, so the selection grows as the page scrolls.
 *
 * The head rides the same `block-move` an ordinary move posts, rather than a scroll of its own:
 * `surface.post` carries one message a frame, and a scroll and a head would compete for it.
 *
 * @param edge -1 past the top, 1 past the bottom, 0 none
 * @returns the drag after the tick and the message to post, none when not dragging past an edge
 */
export function pageEdgeTick(
  drag: CodeDrag,
  edge: -1 | 0 | 1,
  window: PageWindow,
): { drag: CodeDrag; post: SurfaceMessage.SurfaceMessage | null } {
  if (!drag.isDragging || edge === 0) {
    return { drag, post: null };
  }

  const edgeRow = edge < 0 ? window.firstRow : window.firstRow + Math.max(1, window.rowCount) - 1;
  const head = Math.max(0, Math.min(Math.max(0, window.totalRows - 1), edgeRow + edge));

  return { drag: { ...drag, head, hasMoved: true }, post: { kind: 'block-move', anchor: drag.anchor ?? head, head } };
}
