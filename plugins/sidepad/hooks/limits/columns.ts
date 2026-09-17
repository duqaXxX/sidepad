/** Cells the terminal draws around a Button's label: `[ label ]`. */
export const BUTTON_CHROME = 4;

/** The command bar's horizontal padding, each side. */
export const BAR_PADDING = 1;

/** The top row's padding before its first Button. */
export const TOP_ROW_PADDING = 1;

/** Cells kept free at the top row's right end, where the engine draws the pane's close mark. */
export const CLOSE_MARK_CLEAR = 4;

/**
 * The terminal width from which the pane opens when a person asked for it with `/sidepad`: the
 * engine's own floor, which holds a pane undrawn below it ("unasked, it waits undrawn below 144
 * columns (110 once asked), judged at each open"). Narrower than this, `/sidepad` says so instead of
 * opening a pane nothing would draw.
 */
export const OPEN_MIN_COLUMNS = 110;

/** The terminal width from which an edit opens the pane nobody asked for: the engine's other floor. */
export const AUTO_OPEN_MIN_COLUMNS = 144;

/** Cells between two Buttons of the top row, and between the Buttons and the path. */
export const NAVIGATION_GAP = 2;
