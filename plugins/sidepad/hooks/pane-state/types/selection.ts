import type LineRange from '../../line-range';

/** A settled selection of the open file's lines. */
export type Selection = {
  range: LineRange.LineRange;
  /** The line the gesture ended on, kept in view when the selection is taller than the window. */
  head: number;
  /** Whether Ask… was pressed: the bar shows the hint instead of its Buttons. */
  isAsking: boolean;
};
