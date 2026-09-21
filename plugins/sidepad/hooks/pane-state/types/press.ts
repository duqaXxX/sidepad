import type LineRange from '../../line-range';

/** A press in progress on the open file. */
export type Press = {
  /** The selection before the press: a click on that same block clears it. */
  before: LineRange.LineRange | null;
  /** On a formatted page, Markdown or a table, the blocks the press started on and is over now. */
  blocks: { anchor: number; head: number } | null;
};
