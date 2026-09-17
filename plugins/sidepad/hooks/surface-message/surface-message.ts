/** What the pane's Clients post to the hooks, one kind per gesture or report. */
export type SurfaceMessage =
  | { kind: 'drag-start' }
  | { kind: 'range'; start: number; end: number; head: number }
  | { kind: 'click'; line: number }
  | { kind: 'scroll'; by: number }
  | { kind: 'block-rows'; index: number; rows: number }
  | { kind: 'block-down'; index: number }
  | { kind: 'block-move'; index: number; y: number }
  | { kind: 'block-up'; index: number; y: number };
