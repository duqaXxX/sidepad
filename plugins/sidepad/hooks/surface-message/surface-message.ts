/** What the pane's Clients post to the hooks, one kind per gesture. */
export type SurfaceMessage =
  | { kind: 'drag-start' }
  | { kind: 'range'; start: number; end: number; head: number }
  | { kind: 'click'; line: number }
  | { kind: 'scroll'; by: number }
  | { kind: 'block-down'; row: number }
  | { kind: 'block-move'; anchor: number; head: number }
  | { kind: 'block-up'; anchor: number; head: number };
