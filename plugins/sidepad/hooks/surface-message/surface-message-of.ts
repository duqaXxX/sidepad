import type { SurfaceMessage } from './surface-message';

const isInteger = (value: unknown): value is number => Number.isInteger(value);
// A page row addresses the page's rows, which a negative number never does.
const isRow = (value: unknown): value is number => isInteger(value) && value >= 0;

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
    case 'block-down':
      return isRow(d.row) ? { kind: 'block-down', row: d.row } : null;
    case 'block-move':
    case 'block-up':
      return isRow(d.anchor) && isRow(d.head) ? { kind: d.kind, anchor: d.anchor, head: d.head } : null;
    default:
      return null;
  }
}
