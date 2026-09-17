import type LineRange from '../line-range';
import type { CodeDrag } from './code-drag';

/**
 * The lines a drag covers.
 *
 * @returns 1-based lines, or null before a press
 */
export function draggedRangeOf(drag: CodeDrag): LineRange.LineRange | null {
  if (drag.anchor === null || drag.head === null) {
    return null;
  }

  return { start: Math.min(drag.anchor, drag.head) + 1, end: Math.max(drag.anchor, drag.head) + 1 };
}
