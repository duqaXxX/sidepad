import type { ClientPointerEvent } from 'claude-code';

import type SurfaceMessage from '../surface-message';

/**
 * A Markdown block Client's reaction to a pointer event: a left press starts holding and posts it,
 * moves while held post the row, a release stops holding and posts the row.
 *
 * @param isHolding whether this instance holds the pointer
 * @param index the block the instance draws
 * @returns whether it holds after the event, and the message to post
 */
export function blockPointerStep(
  isHolding: boolean,
  event: ClientPointerEvent,
  index: number,
): { isHolding: boolean; post: SurfaceMessage.SurfaceMessage | null } {
  if (event.type === 'down' && event.button === 'left') {
    return { isHolding: true, post: { kind: 'block-down', index } };
  }

  if (event.type === 'move' && isHolding) {
    return { isHolding, post: { kind: 'block-move', index, y: event.y } };
  }

  if (event.type === 'up' && isHolding) {
    return { isHolding: false, post: { kind: 'block-up', index, y: event.y } };
  }

  return { isHolding, post: null };
}
