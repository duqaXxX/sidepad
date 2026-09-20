/**
 * A file Client's own state: what is being dragged, 0-based, and what the press has done. The code
 * page counts the file's lines in it, the formatted page the page's rows.
 */
export type CodeDrag = {
  anchor: number | null;
  head: number | null;
  isDragging: boolean;
  /** Whether this press moved to another line or past an edge: a drag, not a click. */
  hasMoved: boolean;
  /** The hooks' epoch the drag belongs to: a new one clears it. */
  epoch: number;
};

/** No drag. */
export const NO_DRAG: CodeDrag = { anchor: null, head: null, isDragging: false, hasMoved: false, epoch: 0 };
