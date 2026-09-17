import type { SurfaceMessage } from './surface-message';

const isInteger = (value: unknown): value is number => Number.isInteger(value);
// A block index addresses `view.blocks`, which a negative number never does.
const isIndex = (value: unknown): value is number => isInteger(value) && value >= 0;

/**
 * A `ui.message` payload read as one of the Clients' messages, every field checked.
 *
 * @param data what the Client posted
 * @returns the message, or null when the payload is none of them
 */
export function surfaceMessageOf(data: unknown): SurfaceMessage | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const d = data as Record<string, unknown>;

  switch (d.kind) {
    case 'drag-start':
      return { kind: 'drag-start' };
    case 'range':
      return isInteger(d.start) && isInteger(d.end) && isInteger(d.head)
        ? { kind: 'range', start: d.start, end: d.end, head: d.head }
        : null;
    case 'click':
      return isInteger(d.line) ? { kind: 'click', line: d.line } : null;
    case 'scroll':
      return isInteger(d.by) ? { kind: 'scroll', by: d.by } : null;
    case 'block-rows':
      return isIndex(d.index) && isInteger(d.rows) ? { kind: 'block-rows', index: d.index, rows: d.rows } : null;
    case 'block-down':
      return isIndex(d.index) ? { kind: 'block-down', index: d.index } : null;
    case 'block-move':
    case 'block-up':
      return isIndex(d.index) && isInteger(d.y) ? { kind: d.kind, index: d.index, y: d.y } : null;
    default:
      return null;
  }
}
