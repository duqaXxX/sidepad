/** Rows above a page: the top row, and the rule between it and the page. */
export const HEADER_ROWS = 2;

/** Rows below a page: the status line, on the body's last row. */
export const STATUS_ROWS = 1;

/** Blank rows the pane draws between two Markdown blocks. */
export const BLOCK_GAP_ROWS = 1;

/** Lines shown above the first changed line when the pane jumps to an edit. */
export const JUMP_CONTEXT_LINES = 3;

/** Lines a wheel tick moves a file, as `diff`'s WHEEL_ROWS. */
export const WHEEL_LINES = 3;

/** The most rows an image's box occupies, whatever its natural proportion. */
export const IMAGE_MAX_ROWS = 24;

/**
 * The assumed height-to-width ratio of a terminal cell, used to convert pixel dimensions to rows.
 * A cell is about twice as tall as it is wide on most terminals.
 */
export const IMAGE_CELL_ASPECT = 2;
