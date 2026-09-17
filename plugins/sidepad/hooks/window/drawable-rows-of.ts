import Limits from '../limits';

/**
 * How many lines one `Code` can hold at a width, each line cut to the page's width and a margin: the
 * engine refuses a whole drawing whose `Code` source passes MAX_ELEMENT_CHARS, so a page draws at
 * most this many rows however tall it is.
 *
 * @param columns the page's width in cells
 * @returns the rows, at least 1
 */
export const drawableRowsOf = (columns: number) =>
  Math.max(1, Math.floor(Limits.MAX_ELEMENT_CHARS / (Math.max(1, columns) + Limits.CUT_MARGIN_CHARS)));
