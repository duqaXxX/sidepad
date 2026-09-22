/** Cells the terminal draws around a Button's label: `[ label ]`. */
export const BUTTON_CHROME = 4;

/** The command bar's horizontal padding, each side. */
export const BAR_PADDING = 1;

/** The top row's padding before its first Button. */
export const TOP_ROW_PADDING = 1;

/** Cells kept free at the top row's right end, where the engine draws the pane's close mark. */
export const CLOSE_MARK_CLEAR = 4;

/**
 * The terminal width from which `/sidepad` opens the pane: sidepad's own floor, not the engine's. An
 * asked pane is placed at any width, docked beside the transcript from 110 columns and inline above
 * the prompt below that, where sidepad's listing gets no row. Narrower than this, `/sidepad` says so
 * instead of opening an empty pane.
 */
export const OPEN_MIN_COLUMNS = 110;

/** Cells between two Buttons of the top row, and between the Buttons and the path. */
export const NAVIGATION_GAP = 2;

/** The page's padding on its left, which keeps its text off the pane's divider. */
export const PAGE_PADDING = 1;

/** The smallest a table's column is shrunk to before the table is drawn wider than the page. */
export const TABLE_MIN_CELL = 6;
