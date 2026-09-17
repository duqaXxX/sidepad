import type SurfaceMessage from '../surface-message';
import type { CodeDrag } from './code-drag';
import type { CodeWindow } from './code-window';

/**
 * One tick of a drag held past the window's edge: the head moves one line past the edge line shown,
 * and the hooks are asked to scroll one line, so the selection grows as the file scrolls.
 *
 * @param edge -1 past the top, 1 past the bottom, 0 none
 * @returns the drag after the tick and the scroll to post, none when not dragging past an edge
 */
export function edgeTick(
  drag: CodeDrag,
  edge: -1 | 0 | 1,
  window: CodeWindow,
): { drag: CodeDrag; post: SurfaceMessage.SurfaceMessage | null } {
  if (!drag.isDragging || edge === 0) {
    return { drag, post: null };
  }

  const edgeLine = edge < 0 ? window.firstLine : window.firstLine + Math.max(1, window.lineCount) - 1;
  const head = Math.max(0, Math.min(window.totalLines - 1, edgeLine + edge));

  return { drag: { ...drag, head, hasMoved: true }, post: { kind: 'scroll', by: edge } };
}
